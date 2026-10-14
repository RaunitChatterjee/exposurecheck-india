// "Is this the real website?" checker. Pure functions, runs in the browser, nothing is sent anywhere.
// It compares an address with a short verified list of organisations (see orgs.js) and looks for the usual tricks:
// look-alike spelling, brand names used on other domains, free hosting, odd extensions and hidden destinations.
// It can say "official" or "suspicious". For anything else it says "unknown", never "safe".
import { ORGS, TYPE_LABEL } from "./orgs.js";

const MULTI_SUFFIX = ["co.in", "org.in", "net.in", "gov.in", "nic.in", "ac.in", "edu.in", "res.in", "bank.in", "fin.in", "firm.in", "gen.in", "ind.in", "co.uk", "com.au", "co.za"];
const FREE_HOSTS = ["vercel.app", "netlify.app", "pages.dev", "workers.dev", "github.io", "web.app", "firebaseapp.com", "herokuapp.com", "blogspot.com", "weebly.com", "wixsite.com", "000webhostapp.com", "glitch.me", "godaddysites.com", "carrd.co", "webflow.io", "framer.app", "onrender.com"];
const SHORTENERS = ["bit.ly", "tinyurl.com", "t.co", "goo.gl", "cutt.ly", "rb.gy", "is.gd", "shorturl.at", "rebrand.ly", "tiny.cc", "ow.ly", "bl.ink", "wa.me"];
const FREE_MAIL = ["gmail.com", "yahoo.com", "yahoo.in", "outlook.com", "hotmail.com", "rediffmail.com", "proton.me", "protonmail.com", "icloud.com"];
const RISKY_TLDS = ["xyz", "top", "click", "icu", "vip", "buzz", "cfd", "sbs", "cyou", "rest", "monster", "tk", "ml", "ga", "cf", "gq", "work", "site", "online", "live", "shop", "link", "store", "fun"];
const LURE_WORDS = ["login", "signin", "verify", "verification", "update", "kyc", "secure", "refund", "reward", "claim", "support", "helpdesk", "care", "customer", "payment", "offer", "gift", "lucky", "winner", "unblock", "activate", "pan", "link", "official"];
// Short or common-looking brand words only count when they stand alone ("sbi-update.xyz", not "taxisafe.com").
const STRICT_WORDS = new Set(["axis", "trai", "itr", "bob", "sbi", "jio", "rbi", "pnb", "yono", "bhim"]);
// Real, unrelated names that sit one letter away from a listed brand.
const KNOWN_OTHER = new Set(["kodak"]);
const GOV_WORDS = ["gov", "govt", "sarkar", "bharat", "digitalindia", "pmkisan", "scheme", "yojana"];

const prettyList = (a) => a.join(" or ");

// ---------- parsing ----------
export function parseTarget(input) {
  let raw = String(input || "").trim();
  if (!raw) return { ok: false, error: "Paste a link, a website name or an email address." };
  if (raw.length > 500) return { ok: false, error: "That is too long. Paste just the link or address." };
  let kind = "domain";
  let scheme = "";
  let userinfo = false;
  let local = "";
  if (/^[^\s@/]+@[^\s@/]+\.[^\s@/]+$/.test(raw) && !/^[a-z]+:\/\//i.test(raw)) {
    kind = "email";
    [local, raw] = raw.split("@");
  } else {
    const m = raw.match(/^([a-z][a-z0-9+.-]*):\/\//i);
    if (m) { scheme = m[1].toLowerCase(); raw = raw.slice(m[0].length); kind = "link"; }
    else if (/[/?#]/.test(raw)) kind = "link";
    const authority = raw.split(/[/?#]/)[0];
    if (authority.includes("@")) { userinfo = true; }
    raw = authority.includes("@") ? authority.slice(authority.lastIndexOf("@") + 1) : authority;
  }
  let host = raw.replace(/:\d+$/, "").replace(/\.$/, "").toLowerCase().replace(/^www\./, "");
  if (!host || /\s/.test(host) || !/[.]/.test(host) && !/^\[/.test(host)) return { ok: false, error: "That does not look like a website address or email. Example: sbi-kyc-update.xyz or https://example.com/login" };
  return { ok: true, kind, scheme, userinfo, local: local.toLowerCase(), host };
}

export function splitHost(host) {
  const labels = host.split(".");
  let suffix = labels.slice(-1)[0];
  for (const s of MULTI_SUFFIX) if (host === s || host.endsWith("." + s)) { suffix = s; break; }
  const free = FREE_HOSTS.find((f) => host === f || host.endsWith("." + f));
  if (free) suffix = free;
  const rest = host.slice(0, host.length - suffix.length).replace(/\.$/, "");
  const parts = rest ? rest.split(".") : [];
  const name = parts.length ? parts[parts.length - 1] : "";
  const sub = parts.slice(0, -1).join(".");
  return { suffix, name, sub, registrable: name ? `${name}.${suffix}` : suffix, free: Boolean(free) };
}

// ---------- look-alike helpers ----------
export function editDistance(a, b) {
  const m = a.length, n = b.length;
  const d = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 0; j <= n; j++) d[0][j] = j;
  for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++) {
    d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
  }
  return d[m][n];
}

// Undo the usual character swaps: rn -> m, vv -> w, 0 -> o, 1 -> l, 5 -> s.
export function deLeet(s) {
  return s.replace(/rn/g, "m").replace(/vv/g, "w").replace(/0/g, "o").replace(/[1|]/g, "l").replace(/5/g, "s").replace(/3/g, "e");
}

const isOfficialHost = (host, org) => [...org.official, ...(org.legacy || [])].some((d) => host === d || host.endsWith("." + d));
const isNewOfficial = (host, org) => org.official.some((d) => host === d || host.endsWith("." + d));
const isLegacy = (host, org) => (org.legacy || []).some((d) => host === d || host.endsWith("." + d));

function tokens(label) { return label.split(/[^a-z0-9]+/).filter(Boolean); }

function brandHits(hostNoSuffix, orgs) {
  const toks = tokens(hostNoSuffix);
  const flat = hostNoSuffix.replace(/[^a-z0-9]/g, "");
  const leetToks = tokens(deLeet(hostNoSuffix));
  const leetFlat = deLeet(flat);
  const hits = [];
  for (const org of orgs) {
    for (const w of org.words) {
      const loose = !STRICT_WORDS.has(w) && w.length >= 4;
      if (toks.includes(w) || (loose && flat.includes(w))) { hits.push({ org, word: w, leet: false }); break; }
      if (leetToks.includes(w) || (loose && leetFlat.includes(w))) { hits.push({ org, word: w, leet: true }); break; }
    }
  }
  return hits;
}

// Names the organisation really uses (brand words and the name part of its own domains), long enough to compare safely.
function targets(org) {
  const names = new Set(org.words);
  for (const d of [...org.official, ...(org.legacy || [])]) names.add(splitHost(d).name);
  return [...names].filter((w) => w.length >= 5);
}

function nearBrand(label, orgs) {
  const flat = label.replace(/[^a-z0-9]/g, "");
  if (flat.length < 5 || KNOWN_OTHER.has(flat)) return null;
  for (const org of orgs) {
    for (const w of targets(org)) {
      if (flat === w) continue;
      if (deLeet(flat) === w) return { org, word: w, how: "swapped look-alike characters" };
      const dist = editDistance(flat, w);
      if (dist > 0 && dist <= (w.length >= 8 ? 2 : 1) && Math.abs(flat.length - w.length) <= 2) return { org, word: w, how: "a letter added, removed or changed" };
    }
  }
  return null;
}

// ---------- analysis ----------
export function analyzeDomain(input) {
  const p = parseTarget(input);
  if (!p.ok) return { ok: false, error: p.error };
  const { host } = p;
  const findings = [];
  const add = (severity, title, detail, soft = false) => findings.push({ severity, title, detail, soft });
  const facts = [["Address checked", host]];
  const isIp = /^\d{1,3}(\.\d{1,3}){3}$/.test(host) || host.startsWith("[");
  const parts = isIp ? { suffix: "", name: host, sub: "", registrable: host, free: false } : splitHost(host);
  const label = parts.name;
  const hostNoSuffix = host.slice(0, host.length - (parts.suffix ? parts.suffix.length : 0));
  facts.push(["Main domain", parts.registrable]);
  if (parts.sub) facts.push(["Before it", parts.sub]);

  // 1) exact official match
  const exact = isIp ? null : ORGS.find((o) => isOfficialHost(host, o));
  if (exact && !p.userinfo) {
    const legacy = isLegacy(host, exact) && !isNewOfficial(host, exact);
    if (legacy) {
      add("ok", `This is an old official address of ${exact.name}`, `${exact.name} now uses ${prettyList(exact.official)}. The old address may still work or redirect there. A real bank link in a message should already use the new address, so type it yourself or use the bank's app.`);
    } else {
      add("ok", `This matches ${exact.name}'s official address`, exact.type === "bank"
        ? "Banks regulated by the RBI use addresses ending in .bank.in."
        : "It matches the address on the organisation's own website.");
    }
    if (p.scheme === "http") add("warn", "The link does not use HTTPS", "Real sites use HTTPS. Check that it is not a copy.");
    if (p.kind === "email") add("info", "A matching domain does not prove the sender is genuine", "Email addresses can be faked. Do not click links or share details just because an email looks right.");
    return finish({ id: "official", label: "Official address" }, `This address belongs to ${exact.name}.`, findings, facts, exact, p);
  }

  // 2) tricks
  if (p.userinfo) add("bad", "A hidden destination: text before an @ sign", "In a link, anything before the @ is ignored by the browser. The real site is the part after it.");
  if (isIp) add("bad", "The link is a raw number, not a name", "Banks, couriers and government sites do not ask you to log in on an IP address.");
  if (/xn--/.test(host) || /[^\x00-\x7f]/.test(input)) add("bad", "Uses look-alike characters", "Letters from other alphabets can imitate English ones. Treat this address as fake unless you typed it yourself.");
  if (SHORTENERS.includes(host)) add("warn", "A shortened link hides the real destination", "We cannot see where it leads. Ask the sender for the full address, or avoid it.");
  if (parts.free) add("bad", "Hosted on a free website service", `Real banks, couriers and government bodies do not use ${parts.suffix}. Anyone can make a page there in minutes.`);
  const tld = parts.suffix.split(".").pop();
  if (!isIp && RISKY_TLDS.includes(tld) && !parts.free) add("warn", `The ending .${tld} is cheap and common in scams`, "Not proof by itself, but real banks and government sites do not use it.");
  const hyphens = (hostNoSuffix.match(/-/g) || []).length;
  if (hyphens >= 2) add("warn", "Many hyphens in the name", "Names like sbi-kyc-update-now are built to look official. Real organisations use short, plain addresses.");
  const depth = host.split(".").length;
  if (depth >= 5) add("warn", "Very long address with many parts", "Scammers stack words in front of the real domain to hide it.");
  if (p.scheme === "http") add("warn", "The link does not use HTTPS", "Real banking and payment pages always use HTTPS.");

  // 3) brand and category claims
  const hits = isIp ? [] : brandHits(hostNoSuffix, ORGS);
  let claimed = null;
  for (const h of hits) {
    if (!claimed) claimed = h.org;
    const inSub = parts.sub && brandHits(parts.sub, [h.org]).length > 0 && brandHits(label, [h.org]).length === 0;
    const official = h.org.official.join(" or ");
    if (inSub) add("bad", `${h.org.name} appears at the front, but the real site is ${parts.registrable}`, `Read an address from the right: the real owner is the part just before the ending. This belongs to ${parts.registrable}, not ${h.org.name}.`);
    else if (h.leet) add("bad", `Imitates ${h.org.name} with swapped characters`, `Numbers or letter pairs replace letters (like 0 for o). ${h.org.name}'s official address is ${official}. This one is ${parts.registrable}.`);
    else add("bad", `Uses the name ${h.org.name} but is not its address`, `${h.org.name}'s official address is ${official}. This one is ${parts.registrable}. Reach ${h.org.name} through its official app or site instead.`, true);
  }
  const near = !hits.length && !isIp ? nearBrand(label, ORGS) : null;
  if (near) { claimed = near.org; add("bad", `Looks like ${near.org.name}, with ${near.how}`, `${near.org.name}'s official address is ${near.org.official.join(" or ")}. This one is ${parts.registrable}, which is a different owner.`); }

  const toks = tokens(hostNoSuffix);
  const lures = LURE_WORDS.filter((w) => toks.includes(w) || (w.length >= 5 && hostNoSuffix.includes(w)));
  if (lures.length && (claimed || hits.length)) add("warn", "Pressure words in the address", `Words like ${lures.slice(0, 3).join(", ")} are typical of phishing pages that pretend to be an official login or update.`);

  if (!claimed && /bank/.test(hostNoSuffix) && !/\.bank\.in$/.test(host)) {
    add("warn", "Calls itself a bank but does not end in .bank.in", "The RBI told banks to move to addresses ending in .bank.in by 31 October 2025, and most old bank addresses now redirect there. Check in your bank's own app before trusting it.");
  }
  if (claimed && claimed.type === "bank" && !/\.bank\.in$/.test(host)) {
    add("info", "Real bank websites now end in .bank.in", "The RBI told banks to move to .bank.in by 31 October 2025. A bank link that does not end this way is a reason to stop and check.");
  }
  if (!claimed && (GOV_WORDS.some((w) => toks.includes(w) || hostNoSuffix.includes(w)) || /gov/.test(label)) && !/\.(gov|nic)\.in$/.test(host)) {
    add("warn", "Sounds like a government site but is not on gov.in", "Most Indian government bodies use .gov.in or .nic.in (a few, such as IRCTC and the RBI, use others). Check the exact department on the official portal.");
  }
  if (claimed && claimed.type === "gov" && !/\.(gov|nic)\.in$/.test(host)) {
    add("info", "Government bodies mostly use gov.in or nic.in", "A few use other endings (for example irctc.co.in or rbi.org.in), so compare with the exact address above.");
  }

  // 4) email specifics
  if (p.kind === "email") {
    facts.push(["Sent from", `${p.local}@${host}`]);
    const freeMail = FREE_MAIL.includes(host);
    const localHits = brandHits(p.local, ORGS).concat(brandHits(p.local.replace(/[._-]/g, ""), ORGS)).filter((v, i, a) => a.findIndex((x) => x.org.id === v.org.id) === i);
    if (freeMail && localHits.length) add("bad", `A free mailbox pretending to be ${localHits[0].org.name}`, "Banks, couriers and government bodies do not write from Gmail, Yahoo or Outlook addresses.");
    else if (freeMail && /(support|care|help|kyc|refund|official|service|customer)/.test(p.local)) add("warn", "An organisation name on a free mailbox", "Official support does not come from a free email service.");
    add("info", "The sender name can be faked", "If the message came as an email, use the 'Email header analysis' tab to see whether it really came from that domain.");
  }

  const bad = findings.filter((f) => f.severity === "bad").length;
  const warn = findings.filter((f) => f.severity === "warn").length;
  const hard = findings.filter((f) => f.severity === "bad" && !f.soft).length;
  if (bad && !hard && !warn) {
    for (const f of findings) if (f.soft) f.detail += " It could be a separate company in the same group, or a copy of the real site.";
  }
  if (bad && !hard && !warn) return finish({ id: "mismatch", label: "Not the official address" }, `This uses ${claimed ? claimed.name + "'s" : "an organisation's"} name but is not its official address. Do not log in or pay here unless you reached it from the official app or site.`, findings, facts, claimed, p);
  if (bad) return finish({ id: "suspicious", label: "Suspicious, do not trust" }, claimed ? `This is not ${claimed.name}'s address, yet it uses its name or looks like it.` : "Several things about this address are typical of scams.", findings, facts, claimed, p);
  if (warn >= 2) return finish({ id: "caution", label: "Be careful" }, "A few warning signs. Do not log in or pay through it unless you reach it yourself from the official app or site.", findings, facts, claimed, p);
  if (warn === 1) return finish({ id: "caution", label: "Be careful" }, "One warning sign. Check before you trust it.", findings, facts, claimed, p);
  add("info", "Not on our list", "We know a limited set of organisations. An address not on the list is not necessarily fake, and not necessarily safe. Find the organisation's address yourself instead of trusting a link.");
  return finish({ id: "unknown", label: "Not recognised" }, "We cannot tell who owns this address.", findings, facts, null, p);
}

function finish(verdict, headline, findings, facts, org, parsed) {
  const order = { bad: 0, warn: 1, info: 2, ok: 3 };
  return { ok: true, verdict, headline, findings: findings.sort((a, b) => order[a.severity] - order[b.severity]), facts, org: org ? { id: org.id, name: org.name, type: TYPE_LABEL[org.type], official: org.official } : null, host: parsed.host };
}

// A short, checkable table of what is in the list, for the UI and the docs.
export const LIST_SUMMARY = ORGS.map((o) => ({ name: o.name, type: TYPE_LABEL[o.type], official: o.official, legacy: o.legacy || [] }));
