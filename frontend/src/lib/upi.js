// UPI QR / payment-link inspector. Runs fully in the browser: explains in plain words what a UPI code will do.
// Parameters follow the NPCI UPI linking spec (pa = payee address, pn = payee name, am = amount, tn = note, mc = merchant code).

const LINK_RE = /\b(?:upi|gpay|tez|phonepe|paytmmp|bhim|cred|credpay|amazonpay):\/\/[^\r\n"'<>]+/i;
const VPA_RE = /^[a-z0-9._-]{2,256}@[a-z][a-z0-9.]{1,63}$/i;

// Handles commonly used by these apps. Informational only: any bank or app can issue handles.
const HANDLES = {
  ybl: "PhonePe", ibl: "PhonePe", axl: "PhonePe",
  okaxis: "Google Pay", okhdfcbank: "Google Pay", okicici: "Google Pay", oksbi: "Google Pay",
  paytm: "Paytm", apl: "Amazon Pay", yapl: "Amazon Pay", upi: "BHIM",
};

const AUTHORITY_WORDS = /(support|care|helpdesk|help-?desk|refund|official|govt|gov|police|customs|kyc|rbi|sbi|hdfc|icici|axis|income-?tax|cashback|reward|prize|lottery)/i;
const BAIT_WORDS = /(refund|cashback|reward|prize|lottery|kyc|verify|verification|claim|customer care|helpdesk|police|officer|bank|government|gov)/i;

export function parseUpi(raw) {
  const text = String(raw || "").trim();
  if (!text) return { kind: "none" };
  const m = text.match(LINK_RE);
  if (m) {
    let url;
    try { url = new URL(m[0]); } catch { return { kind: "invalid", raw: m[0] }; }
    const p = {};
    for (const [k, v] of url.searchParams) p[k.toLowerCase()] = v;
    const where = (url.hostname + url.pathname).toLowerCase();
    const action = where.includes("collect") ? "collect" : where.includes("mandate") ? "mandate" : where.includes("pay") ? "pay" : "unknown";
    return { kind: "link", raw: m[0], scheme: url.protocol.replace(":", ""), action, params: p,
             pa: p.pa || null, pn: p.pn || null, am: p.am || null, tn: p.tn || null, mc: p.mc || null, cu: p.cu || null, url: p.url || null };
  }
  if (VPA_RE.test(text)) return { kind: "vpa", raw: text, action: "vpa", pa: text, params: {}, pn: null, am: null, tn: null, mc: null, cu: null, url: null };
  if (/^https?:\/\//i.test(text)) return { kind: "web", raw: text };
  return { kind: "unknown", raw: text };
}

export function handleOf(vpa) {
  const h = (vpa || "").split("@")[1];
  return h ? h.toLowerCase() : null;
}

function rupees(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  return `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

export function analyzeUpi(parsed) {
  if (!parsed || parsed.kind === "none") return { ok: false, error: "Paste a UPI link or upload a QR image first." };
  if (parsed.kind === "web") return { ok: false, error: "This is a web link, not a UPI payment code. Use the scam message checker to look at links." };
  if (parsed.kind === "invalid" || parsed.kind === "unknown") return { ok: false, error: "This does not look like a UPI payment link or UPI ID. UPI links start with upi://pay and UPI IDs look like name@bank." };

  const findings = [];
  const add = (severity, title, detail) => findings.push({ severity, title, detail });
  const handle = handleOf(parsed.pa);
  const app = handle && HANDLES[handle];
  const amount = parsed.am ? rupees(parsed.am) : null;
  const amountNum = parsed.am ? Number(parsed.am) : null;
  const payee = parsed.pn || parsed.pa || "an unknown payee";

  let headline;
  if (parsed.action === "collect") {
    headline = "This is a collect request: it asks YOUR account to pay out.";
    add("bad", "Collect requests take money from you", "Approving a collect request, or entering your UPI PIN for one, sends money out of your account. Nobody needs to approve or scan anything to RECEIVE money.");
  } else if (parsed.action === "mandate") {
    headline = "This sets up a recurring auto-debit (UPI AutoPay mandate).";
    add("warn", "Auto-debit permission", "A mandate lets someone take money from your account repeatedly. Approve only subscriptions you chose yourself.");
  } else if (parsed.action === "pay") {
    headline = amount ? `Paying this code will SEND ${amount} from your account to ${payee}.` : `Paying this code will send money from your account to ${payee}. You choose the amount.`;
  } else if (parsed.action === "vpa") {
    headline = `This is a UPI ID (${parsed.pa}). Sending money to it pays that person or business.`;
  } else {
    headline = "This UPI link has an action we do not recognise. Treat it carefully.";
    add("warn", "Unrecognised UPI action", "We could not tell whether this pays, collects or sets up a mandate.");
  }

  if (amount && Number.isFinite(amountNum) && amountNum > 0) {
    add("warn", `A fixed amount of ${amount} is pre-filled`, "If you were told this QR is for receiving money, a refund or cashback, stop. A genuine receive-money code never carries an amount for you to pay.");
    if (amountNum >= 10000) add("warn", "Large amount", "Double-check the payee on a separate channel before sending a large sum.");
  }
  if (parsed.cu && parsed.cu.toUpperCase() !== "INR") add("bad", "Currency is not INR", "UPI payments in India are in rupees. A different currency code is a red flag.");
  if (parsed.action !== "vpa" && !parsed.pn) add("warn", "No payee name in the code", "Genuine merchant codes usually carry a name. Confirm the name your app shows matches who you expect.");
  if (parsed.pn && BAIT_WORDS.test(parsed.pn)) add("warn", "Payee name uses words scammers like", `The name "${parsed.pn}" sounds official or rewarding. Anyone can type any payee name into a QR code.`);
  if (parsed.tn && BAIT_WORDS.test(parsed.tn)) add("warn", "Payment note mentions refund, reward or verification", `The note says "${parsed.tn}". Scam payments are often dressed up with notes like this.`);
  if (parsed.pa && AUTHORITY_WORDS.test(parsed.pa.split("@")[0])) add("warn", "UPI ID tries to look official", `"${parsed.pa}" contains words like support, refund or a bank name. Real banks and government bodies do not collect money through personal-style UPI IDs.`);
  if (parsed.url) add("warn", "The code includes a web link", "Do not open it. Payment codes do not need to send you to a website.");
  if (app) add("info", `UPI ID handle belongs to ${app}`, `Handles like @${handle} are commonly used by ${app}. This tells you which app or bank holds the account, not who owns it.`);
  else if (handle) add("info", `UPI handle @${handle}`, "Any bank or app can issue a handle. It does not tell you who owns the account.");
  if (parsed.action === "pay") {
    add("info", !parsed.mc || parsed.mc === "0000" ? "Looks like a payment to a person" : "Looks like a payment to a merchant", !parsed.mc || parsed.mc === "0000" ? "There is no merchant category code. Be extra careful if someone claiming to be a business or official asks you to pay this." : `Merchant category code ${parsed.mc}. Confirm the shop name shown in your app before paying.`);
  }

  const bad = findings.filter((f) => f.severity === "bad").length;
  const warn = findings.filter((f) => f.severity === "warn").length;
  const verdict = bad ? { id: "high", label: "Do not pay or approve this" } : warn ? { id: "caution", label: "Check carefully before you pay" } : { id: "none", label: "Nothing unusual in the code itself" };

  const facts = [
    ["Action", { pay: "Pay (send money)", collect: "Collect request (take money)", mandate: "AutoPay mandate", vpa: "UPI ID only", unknown: "Unknown" }[parsed.action]],
    ["Payee name", parsed.pn || "Not provided"],
    ["UPI ID", parsed.pa || "Not provided"],
    ["Amount", amount || "Not set"],
    ["Note", parsed.tn || "None"],
  ];
  return { ok: true, verdict, headline, findings, facts };
}
