// Heuristic checker for scam messages (SMS / WhatsApp / email) with India-specific patterns.
// It reports signals, not verdicts: no signals does not mean a message is safe.

const SHORTENERS = new Set(["bit.ly", "tinyurl.com", "t.co", "goo.gl", "cutt.ly", "rb.gy", "is.gd", "shorturl.at", "rebrand.ly", "tiny.cc", "ow.ly", "bl.ink"]);
const RISKY_TLDS = [".xyz", ".top", ".click", ".icu", ".vip", ".buzz", ".site", ".online", ".live", ".shop", ".link", ".cfd", ".sbs"];

// brand tokens seen in a hostname -> domains that genuinely belong to that brand
const BRANDS = [
  { name: "SBI", tokens: ["sbi", "onlinesbi"], official: ["sbi.co.in", "onlinesbi.sbi", "sbicard.com", "sbi.bank.in"] },
  { name: "HDFC Bank", tokens: ["hdfc", "hdfcbank"], official: ["hdfcbank.com", "hdfc.com"] },
  { name: "ICICI Bank", tokens: ["icici", "icicibank"], official: ["icicibank.com", "icici.com"] },
  { name: "Axis Bank", tokens: ["axisbank"], official: ["axisbank.com"] },
  { name: "Paytm", tokens: ["paytm"], official: ["paytm.com", "paytmbank.com"] },
  { name: "PhonePe", tokens: ["phonepe"], official: ["phonepe.com"] },
  { name: "IRCTC", tokens: ["irctc"], official: ["irctc.co.in"] },
  { name: "Amazon", tokens: ["amazon"], official: ["amazon.in", "amazon.com"] },
  { name: "Flipkart", tokens: ["flipkart"], official: ["flipkart.com"] },
  { name: "Jio", tokens: ["jio"], official: ["jio.com"] },
  { name: "Airtel", tokens: ["airtel"], official: ["airtel.in"] },
  { name: "UIDAI (Aadhaar)", tokens: ["uidai"], official: ["uidai.gov.in"] },
  { name: "Income Tax Department", tokens: ["incometax", "incometaxindia"], official: ["incometax.gov.in", "incometaxindia.gov.in"] },
  { name: "NPCI", tokens: ["npci"], official: ["npci.org.in"] },
];

const TEXT_RULES = [
  { id: "otp", weight: 35, label: "Asks you to share an OTP, PIN or CVV",
    detail: "Banks, UPI apps and officials never ask you to share these. Anyone who does is trying to take over your account.",
    re: /\b(share|send|tell|give|forward|provide|read out|enter)\b[^.\n]{0,60}\b(otp|upi pin|mpin|cvv|atm pin|card number)\b|\b(otp|upi pin|mpin|cvv)\b[^.\n]{0,60}\b(share|send|tell|give|forward|provide)\b/,
    re2: /\botp\b[^.\n]{0,40}\b(?:bata\w*|bhej\w*|share|send|dedo|de do|dijiye|dena)\b|\b(?:bata\w*|bhej\w*|share|send|dedo|de do|dijiye)\b[^.\n]{0,40}\b(?:otp|upi pin|mpin|cvv)\b|(?:ओटीपी|पिन|सीवीवी)[^.\n]{0,40}(?:बता|भेज|शेयर|दें|दीजिए)|(?:बता|भेज|शेयर|दें|दीजिए)[^.\n]{0,30}(?:ओटीपी|पिन|सीवीवी)/ },
  { id: "kyc", weight: 25, label: "KYC, PAN or Aadhaar update threat",
    detail: "Real banks do not block accounts by SMS over a pending KYC. Open your bank's official app or visit a branch instead of using a link.",
    re: /\bkyc\b|\bupdate (your )?(pan|aadhaar|aadhar)\b|\b(account|card|pan)\b[^.\n]{0,40}\b(will be|has been|is) (blocked|suspended|frozen|closed|deactivated)/,
    re2: /\bkyc\b[^.\n]{0,40}\b(?:update|expire\w*|pending|band|block\w*)\b|\b(?:khata|account|card|pan)\b[^.\n]{0,40}\b(?:band|block|freeze|suspend)\w*\s*(?:ho|kar)|केवाईसी|(?:खाता|अकाउंट|कार्ड|पैन)[^.\n]{0,30}(?:बंद|ब्लॉक|फ्रीज़|सस्पेंड)/ },
  { id: "urgency", weight: 10, label: "Pressure to act immediately",
    detail: "Scammers create panic so you act before thinking.",
    re: /\b(immediately|urgent(ly)?|within \d+ ?(hours?|hrs?|minutes?|mins?)|last (warning|chance|notice)|final notice|expires? (today|tonight)|tonight)\b/,
    re2: /\b(?:turant|foran|jaldi se jaldi|aaj hi|24 ghante|48 ghante|abhi (?:update|call|click|link|pay|karein))\b|तुरंत|आज ही|24 घंटे|48 घंटे/ },
  { id: "utility", weight: 25, label: "Electricity or utility disconnection threat",
    detail: "A common scam: 'your power will be cut tonight unless you call or pay'. Check your bill on the official provider app.",
    re: /(electricity|power)[^.\n]{0,60}(disconnect|cut off|suspend)|(disconnect|cut off)[^.\n]{0,60}(electricity|power)/,
    re2: /\bbijli\b[^.\n]{0,60}\b(?:kaa?t|band|disconnect)\w*|बिजली[^.\n]{0,40}(?:कट|बंद|काट)/ },
  { id: "parcel", weight: 20, label: "Parcel, courier or customs problem",
    detail: "Fake courier messages ask for a small 'fee' or a call back. Track real parcels only on the courier's official site or app.",
    re: /(parcel|package|courier|consignment)[^.\n]{0,80}(held|stuck|customs|seized|returned|address|incomplete|undelivered)|\b(fedex|dhl|blue dart)\b[^.\n]{0,60}(fee|pay|charge)/,
    re2: /\b(?:parcel|courier|package)\b[^.\n]{0,60}\b(?:rok|atka|customs|pata|address|wapas)\w*|(?:पार्सल|कूरियर)[^.\n]{0,60}(?:रोक|अटका|कस्टम|पता|वापस|जब्त)/ },
  { id: "authority", weight: 35, label: "Claims of police, CBI, customs or 'digital arrest'",
    detail: "No agency arrests people over a video call or asks for money to close a case. 'Digital arrest' is a known scam. Hang up and call 1930.",
    re: /\b(digital arrest|cbi|enforcement directorate|narcotics|money laundering|arrest warrant|customs officer|cyber ?crime branch)\b|\b(?:police|crime branch|cyber cell)\b[^.\n]{0,60}\b(?:case|parcel|drugs?|arrest|fir)\b|\bdrugs?\b[^.\n]{0,50}\bparcel\b|\bparcel\b[^.\n]{0,60}\b(?:drugs?|illegal|contraband)\b/,
    re2: /\b(?:giraftar\w*|warrant)\b|\bpolice\b[^.\n]{0,40}\b(?:bol|se baat|officer)\w*|\bdrugs?\b[^.\n]{0,50}\b(?:parcel|mile|mila)\b|\bparcel\b[^.\n]{0,60}\bdrugs?\b|\bdigital arrest\b|गिरफ्तार|वारंट|सीबीआई|नारकोटिक्स|मनी लॉन्ड्रिंग|डिजिटल अरेस्ट/ },
  { id: "collect", weight: 30, label: "Asks you to approve a request or scan a QR to receive money",
    detail: "Receiving money never needs your PIN, approval or a QR scan. A 'collect request' takes money out of your account.",
    re: /\b(collect request|approve (the |this )?(payment )?request|scan (this |the )?qr)\b/,
    re2: /\b(?:request|collect)\b[^.\n]{0,30}\b(?:accept|approve|swikar|manjoor)\w*|\b(?:upi pin|pin)\b[^.\n]{0,30}\b(?:daal\w*|dal\w*|dalein)\b|\bqr\b[^.\n]{0,40}\bscan\b[^.\n]{0,60}\b(?:paise|refund|cashback|paisa)\b|रिक्वेस्ट[^.\n]{0,30}(?:स्वीकार|एक्सेप्ट|अप्रूव)|पिन\s+डाल|क्यूआर[^.\n]{0,30}स्कैन/ },
  { id: "prize", weight: 20, label: "Prize, lottery or cashback offer",
    detail: "Unexpected winnings are bait for a 'processing fee' or your bank details.",
    re: /\b(you (have )?won|lottery|lucky draw|kbc|claim your (prize|reward|gift)|congratulations[^.\n]{0,50}(prize|reward|cash))\b/,
    re2: /\b(?:aapne|aap ne)\b[^.\n]{0,30}\b(?:jeet\w*|won)\b|\binaam\b|इनाम|लॉटरी|आपने[^.\n]{0,30}(?:जीता|जीते)/ },
  { id: "job", weight: 30, label: "Part-time job or online task offer",
    detail: "'Earn per day' task and Telegram group jobs usually start with small payouts and end with you paying in.",
    re: /\b(part[- ]?time (job|work)|work from home[^.\n]{0,60}earn|earn (₹|rs\.?\s?)?\d[\d,]*\s?(per|a|\/)\s?(day|hour)|telegram (group|channel)|like (and )?subscribe[^.\n]{0,40}earn)\b|\bper task\b|\b(?:lik(?:e|ing)|review(?:ing)?s?|rating)\b[^.\n]{0,70}\b(?:earn|commission|daily|per day)\b|\b(?:earn|commission)\b[^.\n]{0,70}\b(?:lik(?:e|ing)|reviews?)\b|\btasks?\b[^.\n]{0,40}\b(?:commission|earn|withdraw)\b/,
    re2: /\bghar baithe\b[^.\n]{0,40}\bkam\w*|\b(?:video )?like\b[^.\n]{0,40}\breview\b[^.\n]{0,40}\b(?:kamaye|kamai|earn|roz)\w*|\broz\b[^.\n]{0,20}\b(?:\d+|hazar)\b[^.\n]{0,20}\bkam\w*|\bpart time\b|घर बैठे[^.\n]{0,30}(?:कमा|कमाई)|पार्ट टाइम|टेलीग्राम\s*(?:ग्रुप|चैनल)/ },
  { id: "remote", weight: 35, label: "Asks you to install a remote-access app",
    detail: "AnyDesk, TeamViewer and similar apps let a stranger see and control your phone, including banking apps. Never install them for a caller.",
    re: /\b(anydesk|teamviewer|quicksupport|rustdesk|airdroid)\b/,
    re2: /एनीडेस्क|टीमव्यूअर|क्विकसपोर्ट/ },
  { id: "app", weight: 15, label: "Pushes an app install from a link",
    detail: "Install apps only from the Play Store or App Store. Fake bank apps spread by link.",
    re: /\b(install|download) (this|the|our) (app|application)\b/,
    re2: /\bapp\b[^.\n]{0,20}\b(?:install|download)\b[^.\n]{0,10}\b(?:karein|karen|kare|krein|karo|kro)\b|ऐप\s+(?:इंस्टॉल|डाउनलोड)/ },
  { id: "sim", weight: 25, label: "SIM or mobile number block threat",
    detail: "Telecom operators and TRAI do not threaten disconnection by SMS or call asking you to press a key or share details.",
    re: /\b(sim|mobile number)\b[^.\n]{0,50}\b(blocked|deactivated|disconnected|suspended)\b|\btrai\b/,
    re2: /\bsim\b[^.\n]{0,40}\b(?:band|block|deactivate)\w*|सिम[^.\n]{0,30}(?:बंद|ब्लॉक)/ },
  { id: "invest", weight: 30, label: "Guaranteed returns or 'VIP tips' investment pitch",
    detail: "No legitimate investment guarantees returns. Stock-tip groups on WhatsApp and Telegram are a common fraud route.",
    re: /\b(guaranteed\s+(?:\d{2,4}%\s*)?(returns?|profit)|double your (money|investment)|(?:vip|premium)\s+(?:[a-z]+\s+){0,2}(?:group|channel|tips)|\d{2,4}%\s*(returns?|profit)\s*(daily|weekly|per (day|week))|\d{2,4}%\s*(returns?|profit)[^.\n]{0,20}\b(?:in|within)\s+\d+\s*(?:days?|weeks?))\b/,
    re2: /\b(?:paisa|paise)\b[^.\n]{0,20}\b(?:double|dugna|dugne)\b|पैसा\s+(?:दुगना|डबल)|गारंटीड\s+रिटर्न/ },
  { id: "secrecy", weight: 25, label: "Tells you to stay on the call or keep it secret",
    detail: "Scammers isolate you so no one can tell you it is a fraud. A real agency never forbids you from speaking to family or ending a call.",
    re: /\b(do not|don't|dont|never)\s+(?:tell|inform|discuss|disconnect|cut|end|hang up)\b[^.\n]{0,50}\b(?:anyone|anybody|family|others|call|video|case)\b|\bkeep (?:this|it) (?:confidential|secret)\b|\bconfidential (?:case|matter)\b|\bstay on the (?:video )?call\b/,
    re2: /\b(?:kisi ko|kisi se)\b[^.\n]{0,20}\b(?:mat|nahi)\b[^.\n]{0,15}\b(?:bata\w*|bol\w*)\b|\bcall\b[^.\n]{0,25}\b(?:mat|na)\b[^.\n]{0,10}\b(?:kaat\w*|kat\w*|band)\b|\bvideo call\b[^.\n]{0,20}\b(?:mat|na)\b[^.\n]{0,10}\b(?:kaat\w*|kat\w*)\b|किसी को[^.\n]{0,20}(?:मत|नहीं)[^.\n]{0,10}(?:बता|बोल)/ },
  { id: "transfer", weight: 30, label: "Asks you to move money to 'verify' or 'clear' a case",
    detail: "No court, bank, RBI or police officer asks you to transfer money to a 'safe', 'verification' or 'supervision' account. This is how digital-arrest scams take your savings.",
    re: /\b(?:transfer|deposit|send|pay)\b[^.\n]{0,60}\b(?:rbi|verification|safe|secure|supervision|clearance|investigation)\b|\b(?:clear|close|settle)\b[^.\n]{0,20}\b(?:case|your name)\b/,
    re2: /\bcase\b[^.\n]{0,60}\b(?:paise|paisa|rupaye|transfer|jama)\b|\b(?:paise|rupaye|amount)\b[^.\n]{0,40}\b(?:transfer|jama)\b[^.\n]{0,40}\bcase\b|केस[^.\n]{0,40}(?:पैसे|ट्रांसफर|जमा)/ },
  { id: "payin", weight: 30, label: "Asks you to pay a fee or deposit before you can earn",
    detail: "Task and job scams let you 'withdraw' small payouts at first, then demand larger deposits. Real employers never charge to start work.",
    re: /\b(?:first|initial)?\s*(?:deposit|recharge)\b[^.\n]{0,40}\b(?:unlock|activate|task|withdraw|commission|start)\b|\b(?:registration|joining|activation|security|processing) (?:fee|deposit|charges?)\b|\bunlock\b[^.\n]{0,30}\b(?:task|group|account)\b/,
    re2: /\b(?:registration|joining) fee\b|\bpehle\b[^.\n]{0,20}\b(?:paise|fee|deposit)\b|\bdeposit\b[^.\n]{0,20}\b(?:karein|karo|bharni|bharein)\b|रजिस्ट्रेशन फीस/ },
  { id: "chatapp", weight: 10, label: "Moves you to WhatsApp or Telegram",
    detail: "Unknown senders who push you into a private chat group are usually trying to run a task, job or investment scam.",
    re: /\b(?:join|message|contact|dm|chat|add)\b[^.\n]{0,30}\b(?:whatsapp|telegram)\b|\bt\.me\/|\bwa\.me\/|\btips?\b[^.\n]{0,25}\b(?:whatsapp|telegram)\b/,
    re2: /\b(?:whatsapp|telegram)\b[^.\n]{0,30}\b(?:join|group|jud\w*)\b|टेलीग्राम/ },
  { id: "callback", weight: 15, label: "Asks you to call or contact a number",
    detail: "Scams often push you to phone a 'helpline' or 'officer' number from the message instead of using the official one printed on your bill or card.",
    re: /\b(?:call|contact|whatsapp|reach)\b[^.\n]{0,50}(?:\+?91[-\s]?)?[6-9][\d xX*]{8,11}\b/,
    re2: /\b(?:sampark|call)\b[^.\n]{0,50}(?:\+?91[-\s]?)?[6-9][\d xX*]{8,11}\b|सम्पर्क|संपर्क[^.\n]{0,40}[6-9][\d xX*]{8,11}/ },
];

const URL_RE = /\b(?:https?:\/\/|www\.)[^\s<>"')]+|\b[a-z0-9-]+(?:\.[a-z0-9-]+)*\.(?:com|in|co\.in|net|org|xyz|top|click|link|info|shop|site|online|live|vip|icu|buzz|cfd|sbs)\b(?:\/[^\s<>"')]*)?/gi;

export function extractUrls(text) {
  const out = [];
  for (const m of text.match(URL_RE) || []) {
    const cleaned = m.replace(/[.,;:!?]+$/, "");
    if (!out.includes(cleaned)) out.push(cleaned);
  }
  return out;
}

function parseHost(u) {
  try {
    const url = new URL(/^https?:\/\//i.test(u) ? u : `http://${u}`);
    return { host: url.hostname.toLowerCase().replace(/\.$/, ""), url };
  } catch {
    return null;
  }
}

function urlSignals(u) {
  const p = parseHost(u);
  if (!p) return [];
  const { host, url } = p;
  const out = [];
  const add = (id, weight, label, detail) => out.push({ id, weight, label, detail, evidence: u });

  if (SHORTENERS.has(host)) add("shortener", 15, "Shortened link hides the real destination", "You cannot tell where it leads. Do not tap it; ask the sender through another channel.");
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) add("ip", 30, "Link points to a raw IP address", "Legitimate banks and shops use domain names, not numeric addresses.");
  if (RISKY_TLDS.some((t) => host.endsWith(t))) add("tld", 15, "Link uses an extension often seen in scams", "Cheap domains such as .xyz, .top and .click are common in phishing. Not proof, but a reason for caution.");
  if (host.includes("xn--")) add("punycode", 25, "Link uses look-alike (punycode) characters", "Different Unicode letters can imitate a real site's name.");
  if (url.username || url.password) add("userinfo", 25, "Link contains a hidden '@' redirect trick", "Everything before the @ is ignored; the real destination is what follows.");
  if (url.pathname.toLowerCase().endsWith(".apk")) add("apk", 30, "Link downloads an Android app file (.apk)", "Banks do not send app files by link. These often steal SMS and banking data.");
  if (host.split(".")[0].split("-").length > 3) add("hyphens", 10, "Link has many hyphens in its name", "Names like secure-login-update-bank are typical of fake sites.");
  if (/^http:/i.test(u)) add("http", 5, "Link does not use HTTPS", "Real banking and payment pages always use HTTPS.");

  const tokens = host.split(/[.-]/);
  for (const b of BRANDS) {
    if (tokens.some((t) => b.tokens.includes(t)) && !b.official.some((d) => host === d || host.endsWith(`.${d}`))) {
      add(`brand-${b.name}`, 35, `Uses the name ${b.name} on a site that is not theirs`, `The real ${b.name} site is ${b.official[0]}. Type it yourself or use the official app.`);
      break;
    }
  }
  if (tokens.includes("gov") && !(host.endsWith(".gov.in") || host.endsWith(".nic.in"))) {
    add("fakegov", 20, "Looks like a government site but is not on .gov.in", "Indian government sites end in .gov.in or .nic.in.");
  }
  return out;
}

export function levelFor(score) {
  if (score >= 70) return { id: "high", label: "Very likely a scam" };
  if (score >= 40) return { id: "likely", label: "Likely a scam" };
  if (score >= 20) return { id: "caution", label: "Suspicious, be careful" };
  return { id: "none", label: "No strong scam signals found" };
}

// Genuine OTP messages say "do not share"; remove such warnings so they do not look like requests.
const NEGATED_SHARE = /\b(?:do not|don't|dont|never|not to)\s+(?:share|send|tell|give|forward|provide|disclose|reveal)\b[^.\n]*/g;
const NEGATED_SHARE_HI = /(?:kisi\s+(?:ke\s+saath\s+|ko\s+|se\s+)?)?(?:share\s+|batana\s+|batayein\s+)?(?:na|mat|nahi)\s+(?:karein|karen|kare|krein|karo|batayein|bataye|batao|batana|dein|den|dena|bhejein|bhejen)\b[^.\n]*/g;
const NEGATED_SHARE_DV = /(?:किसी\s+(?:के\s+साथ\s+|को\s+|से\s+)?)?(?:शेयर\s+|साझा\s+)?(?:न|ना|नहीं|मत)\s+(?:करें|बताएं|बताइए|दें|भेजें)[^.\n]*/g;

export function detectLanguage(text) {
  if (/[\u0900-\u097F]/.test(text)) return "Hindi";
  const hits = (text.toLowerCase().match(/\b(aapka|aapki|aapke|karein|kare|hai|hain|jayega|nahi|kripya|turant|khata|paise|jaldi|batayein|dijiye|aap)\b/g) || []).length;
  return hits >= 2 ? "Hinglish" : "English";
}

export function analyzeMessage(text) {
  const lower = (text || "").toLowerCase();
  const signals = [];
  for (const r of TEXT_RULES) {
    const target = r.id === "otp" ? lower.replace(NEGATED_SHARE, " ").replace(NEGATED_SHARE_HI, " ").replace(NEGATED_SHARE_DV, " ") : lower;
    const m = target.match(r.re) || (r.re2 ? target.match(r.re2) : null);
    if (m) signals.push({ id: r.id, weight: r.weight, label: r.label, detail: r.detail, evidence: m[0].trim().slice(0, 80) });
  }
  const urls = extractUrls(text || "");
  for (const u of urls) signals.push(...urlSignals(u));
  const seen = new Set();
  const unique = signals.filter((s) => (seen.has(s.id) ? false : seen.add(s.id)));
  const score = Math.min(100, unique.reduce((a, s) => a + s.weight, 0));
  unique.sort((a, b) => b.weight - a.weight);
  return { score, level: levelFor(score), signals: unique, urls, language: detectLanguage(text || "") };
}
