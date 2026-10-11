// Email header analyzer. Runs entirely in the browser; pasted headers are never sent anywhere.
// Advisory only: authentication results are trustworthy when added by YOUR mail provider (the topmost one).

export function parseHeaders(raw) {
  const lines = String(raw || "").replace(/\r\n/g, "\n").split("\n");
  const unfolded = [];
  for (const line of lines) {
    if (/^[ \t]/.test(line) && unfolded.length) unfolded[unfolded.length - 1] += " " + line.trim();
    else if (line.trim() !== "") unfolded.push(line);
    else if (unfolded.length) break; // blank line ends the header block
  }
  const map = new Map();
  for (const l of unfolded) {
    const i = l.indexOf(":");
    if (i < 1) continue;
    const name = l.slice(0, i).trim().toLowerCase();
    if (!/^[a-z0-9-]+$/.test(name)) continue;
    const val = l.slice(i + 1).trim();
    if (!map.has(name)) map.set(name, []);
    map.get(name).push(val);
  }
  return map;
}

export function addressOf(value) {
  if (!value) return null;
  const angle = value.match(/<([^<>\s]+@[^<>\s]+)>/);
  const bare = value.match(/([^\s<>"',;]+@[^\s<>"',;]+)/);
  const email = (angle ? angle[1] : bare ? bare[1] : "").toLowerCase();
  if (!email) return null;
  const display = value.replace(/<[^>]*>/, "").replace(/"/g, "").trim();
  return { email, domain: email.split("@")[1], display };
}

function isPrivateIp(ip) {
  const [a, b] = ip.split(".").map(Number);
  return a === 10 || a === 127 || (a === 192 && b === 168) || (a === 172 && b >= 16 && b <= 31) || (a === 169 && b === 254);
}

function related(a, b) {
  return !!a && !!b && (a === b || a.endsWith("." + b) || b.endsWith("." + a));
}

function authResult(headers) {
  const ar = (headers.get("authentication-results") || [])[0] || "";
  const pick = (mech) => {
    const m = ar.match(new RegExp(`\\b${mech}=(\\w+)`, "i"));
    return m ? m[1].toLowerCase() : null;
  };
  let spf = pick("spf");
  if (!spf) {
    const rs = (headers.get("received-spf") || [])[0];
    const m = rs && rs.match(/^\s*(pass|fail|softfail|neutral|none|temperror|permerror)/i);
    if (m) spf = m[1].toLowerCase();
  }
  const dkimDomain = (ar.match(/dkim=\w+[^;]*?header\.[di]=@?([^\s;]+)/i) || [])[1] || null;
  return { present: !!ar, spf, dkim: pick("dkim"), dmarc: pick("dmarc"), dkimDomain: dkimDomain && dkimDomain.replace(/^.*@/, "").toLowerCase() };
}

export function parseHops(headers) {
  const received = headers.get("received") || [];
  const hops = received.map((r) => {
    const from = (r.match(/\bfrom\s+([^\s;]+)/i) || [])[1] || null;
    const by = (r.match(/\bby\s+([^\s;]+)/i) || [])[1] || null;
    const ips = [...r.matchAll(/\[?\b(\d{1,3}(?:\.\d{1,3}){3})\b\]?/g)].map((m) => m[1]).filter((ip) => ip.split(".").every((o) => +o <= 255));
    const uniqueIps = [...new Set(ips)];
    const when = r.includes(";") ? r.slice(r.lastIndexOf(";") + 1).trim() : null;
    const t = when ? Date.parse(when) : NaN;
    return { from, by, ips: uniqueIps, time: Number.isNaN(t) ? null : new Date(t) };
  });
  return hops.reverse(); // earliest first
}

function fmtDuration(ms) {
  const m = Math.round(ms / 60000);
  if (m < 60) return `${m} minutes`;
  const h = Math.round(m / 6) / 10;
  return `${h} hours`;
}

export function analyzeHeaders(raw) {
  const headers = parseHeaders(raw);
  const findings = [];
  const add = (severity, title, detail) => findings.push({ severity, title, detail });
  if (headers.size === 0) return { ok: false, error: "No email headers found. Paste the full raw headers, starting with lines like 'Received:' or 'From:'." };

  const from = addressOf((headers.get("from") || [])[0]);
  const returnPath = addressOf((headers.get("return-path") || [])[0]);
  const replyTo = addressOf((headers.get("reply-to") || [])[0]);
  const auth = authResult(headers);
  const hops = parseHops(headers);

  if (!auth.present && !auth.spf) {
    add("warn", "No authentication results in the headers", "Without SPF, DKIM and DMARC results this message cannot be verified. Forwarded mail or partial headers can cause this.");
  } else {
    const bad = [];
    if (auth.spf && ["fail", "softfail", "permerror"].includes(auth.spf)) bad.push(`SPF ${auth.spf}`);
    if (auth.dkim && ["fail", "permerror"].includes(auth.dkim)) bad.push(`DKIM ${auth.dkim}`);
    if (auth.dmarc && ["fail", "permerror"].includes(auth.dmarc)) bad.push(`DMARC ${auth.dmarc}`);
    if (bad.length) add("bad", `Authentication failed: ${bad.join(", ")}`, "The sending server was not authorised to send as this domain, or the message was altered. Treat messages claiming to be from a bank or government body with extreme suspicion.");
    else if (auth.spf === "pass" && auth.dkim === "pass" && auth.dmarc === "pass") add("ok", "SPF, DKIM and DMARC all pass", "The sender domain is authenticated. This does not make the content safe; criminals can authenticate their own look-alike domains.");
    else add("warn", "Authentication is incomplete", `SPF: ${auth.spf || "not reported"}, DKIM: ${auth.dkim || "not reported"}, DMARC: ${auth.dmarc || "not reported"}.`);
  }

  if (from && from.display.includes("@")) {
    const shown = addressOf(from.display);
    if (shown && shown.domain !== from.domain) add("bad", "Display name shows a different email address", `The name reads "${from.display}" but the message really comes from ${from.email}. This is a classic spoofing trick.`);
  }
  if (from && returnPath && !related(from.domain, returnPath.domain)) add("warn", "Return-Path domain differs from From domain", `From ${from.domain}, bounces to ${returnPath.domain}. Common for bulk-mail services, but suspicious if the sender claims to be a bank or government body.`);
  if (from && replyTo && !related(from.domain, replyTo.domain)) add("warn", "Reply-To sends replies elsewhere", `Replies go to ${replyTo.email}, not ${from.domain}. Scammers use this to collect your answer.`);
  if (from && auth.dkimDomain && !related(from.domain, auth.dkimDomain)) add("warn", "DKIM signature is from a different domain", `Signed by ${auth.dkimDomain}, not ${from.domain}. The signature passes for that domain only, not for the one shown as sender.`);

  for (let i = 1; i < hops.length; i++) {
    const a = hops[i - 1].time, b = hops[i].time;
    if (a && b && b - a > 3600 * 1000) add("info", `Long delay before hop ${i + 1}`, `The message waited ${fmtDuration(b - a)} between servers. Delays can mean queueing, greylisting or a slow relay.`);
    if (a && b && b < a) add("warn", `Timestamps go backwards at hop ${i + 1}`, "Server clocks disagree or a header was forged. Headers below your own provider's are easy to fake.");
  }
  const origin = hops.flatMap((h) => h.ips).find((ip) => !isPrivateIp(ip)) || null;
  const xo = (headers.get("x-originating-ip") || [])[0];

  const bads = findings.filter((f) => f.severity === "bad").length;
  const warns = findings.filter((f) => f.severity === "warn").length;
  const verdict = bads ? { id: "high", label: "Signs of spoofing or forgery" } : warns ? { id: "caution", label: "Some things look off" } : { id: "none", label: "No red flags in the headers" };

  return {
    ok: true, verdict, findings, auth, hops, originIp: origin, xOriginatingIp: xo ? xo.replace(/[\[\]]/g, "") : null,
    summary: { from: from && from.email, returnPath: returnPath && returnPath.email, replyTo: replyTo && replyTo.email,
               subject: (headers.get("subject") || [])[0] || null, date: (headers.get("date") || [])[0] || null },
  };
}
