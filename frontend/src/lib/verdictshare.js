// "Warn someone" text for a check result. Pure functions; nothing is stored or sent anywhere.
// The message or QR content itself is never included, only the warning signs. A website address is shown
// "defanged" (dots in brackets) so a chat app does not turn it into a tappable link.
// Only warnings are shareable: a reassuring result is never turned into a "this is safe" message.

export const SHARE_LANGS = [
  { id: "en", label: "English" },
  { id: "hinglish", label: "Hinglish" },
  { id: "hi", label: "हिन्दी" },
];

export const SITE_URL = "https://exposurecheck-india.vercel.app";

const TONES = {
  message: { high: "danger", likely: "danger", caution: "warn" },
  website: { suspicious: "danger", mismatch: "warn", caution: "warn" },
  upi: { high: "danger", caution: "warn" },
};
export const toneFor = (kind, level) => (TONES[kind] || {})[level] || null;

const T = {
  en: {
    head: {
      danger: { message: "Warning: a message I checked looks like a scam.", website: "Warning: a website address I checked looks fake.", upi: "Warning: a UPI QR or link I checked looks risky." },
      warn: { message: "Be careful: a message I checked looks suspicious.", website: "Be careful: a website address I checked looks suspicious.", upi: "Be careful: a UPI QR or link I checked needs a second look." },
    },
    why: "Why:", todo: "What to do:", address: "Address",
    steps: {
      message: ["Do not click any link or reply.", "Never share an OTP, PIN or card details."],
      website: ["Do not log in or pay on it.", "Open the organisation's own app, or type its address yourself."],
      upi: ["Do not scan or approve it. You never need a PIN to receive money.", "Check the payee name in your payment app."],
    },
    paid: "If you already paid or shared anything, call 1930 straight away and report at cybercrime.gov.in.",
    foot: "Checked free with ExposureCheck India (nothing stored):",
  },
  hinglish: {
    head: {
      danger: { message: "Chetavni: maine ek message check kiya, wo scam lagta hai.", website: "Chetavni: maine ek website address check kiya, wo nakli lagta hai.", upi: "Chetavni: maine ek UPI QR ya link check kiya, wo khatarnak lagta hai." },
      warn: { message: "Savdhan: maine ek message check kiya, wo shak wala hai.", website: "Savdhan: maine ek website address check kiya, wo shak wala hai.", upi: "Savdhan: maine ek UPI QR ya link check kiya, use dobara dekhna chahiye." },
    },
    why: "Kyun:", todo: "Kya karein:", address: "Address",
    steps: {
      message: ["Koi link na dabayein aur reply na karein.", "OTP, PIN ya card ki jaankari kisi ko na dein."],
      website: ["Us par login ya payment na karein.", "Company ka apna app kholein ya address khud type karein."],
      upi: ["Use scan ya approve na karein. Paise lene ke liye PIN ki zaroorat nahi padti.", "Apne payment app me payee ka naam check karein."],
    },
    paid: "Agar paisa chala gaya ya kuch share ho gaya, to turant 1930 par call karein aur cybercrime.gov.in par report karein.",
    foot: "ExposureCheck India se free check kiya (kuch save nahi hota):",
  },
  hi: {
    head: {
      danger: { message: "चेतावनी: मैंने एक संदेश जाँचा, वह धोखाधड़ी लगता है।", website: "चेतावनी: मैंने एक वेबसाइट का पता जाँचा, वह नकली लगता है।", upi: "चेतावनी: मैंने एक UPI QR या लिंक जाँचा, वह जोखिम भरा लगता है।" },
      warn: { message: "सावधान: मैंने एक संदेश जाँचा, वह संदिग्ध है।", website: "सावधान: मैंने एक वेबसाइट का पता जाँचा, वह संदिग्ध है।", upi: "सावधान: मैंने एक UPI QR या लिंक जाँचा, उसे दोबारा देखना चाहिए।" },
    },
    why: "क्यों:", todo: "क्या करें:", address: "पता",
    steps: {
      message: ["कोई लिंक न दबाएँ और जवाब न दें।", "OTP, पिन या कार्ड की जानकारी किसी को न दें।"],
      website: ["उस पर लॉगिन या भुगतान न करें।", "संस्था का अपना ऐप खोलें या पता खुद टाइप करें।"],
      upi: ["उसे स्कैन या स्वीकार न करें। पैसे पाने के लिए पिन नहीं लगता।", "अपने पेमेंट ऐप में पाने वाले का नाम जाँचें।"],
    },
    paid: "अगर पैसे चले गए या कोई जानकारी दे दी, तो तुरंत 1930 पर कॉल करें और cybercrime.gov.in पर शिकायत करें।",
    foot: "ExposureCheck India से मुफ़्त जाँचा (कुछ सहेजा नहीं जाता):",
  },
};

// Short translations of the scam checker's warning signs, keyed by signal id.
const SIGNS = {
  hinglish: {
    otp: "OTP, PIN ya CVV maanga ja raha hai", kyc: "KYC, PAN ya Aadhaar update ki dhamki", urgency: "Turant action ka dabav",
    utility: "Bijli ya utility connection kaatne ki dhamki", parcel: "Parcel, courier ya customs ki problem",
    authority: "Police, CBI, customs ya 'digital arrest' ka daava", collect: "Paise lene ke liye request approve ya QR scan karne ko kaha",
    prize: "Inaam, lottery ya cashback ka offer", job: "Part-time job ya online task ka offer", remote: "Remote-access app install karne ko kaha",
    app: "Link se app install karwane ki koshish", sim: "SIM ya mobile number band hone ki dhamki", invest: "Pakka munafa ya 'VIP tips' ka investment offer",
    secrecy: "Call par bane rehne ya baat chhupane ko kaha", transfer: "'Verify' karne ke liye paise transfer karne ko kaha",
    payin: "Kamaane se pehle fee ya deposit maanga", chatapp: "WhatsApp ya Telegram par le jaane ki koshish", callback: "Kisi number par call karne ko kaha",
    details: "Bank, card ya ID ki jaankari maangi", refund: "Achanak refund ya tax refund ki baat", ivr: "'1 dabayein' kehkar customer care ka dikhawa",
    subscription: "Subscription khatam ya payment problem ka bahana", shortener: "Chhota link jo asli jagah chhupata hai",
    ip: "Link ek IP address par jata hai", tld: "Link ka ending .xyz/.top jaisa sasta hai", punycode: "Link me nakli (milte-julte) akshar",
    userinfo: "Link me chhupi '@' chaal", apk: "Link se .apk app file download hoti hai", hyphens: "Link ke naam me bahut hyphen", http: "Link HTTPS nahi hai",
    fakegov: "Sarkari site jaisa dikhta hai par .gov.in nahi hai", brand: "Kisi asli company ka naam nakli site par",
  },
  hi: {
    otp: "OTP, पिन या CVV माँगा जा रहा है", kyc: "KYC, PAN या आधार अपडेट की धमकी", urgency: "तुरंत कार्रवाई का दबाव",
    utility: "बिजली या अन्य कनेक्शन कटने की धमकी", parcel: "पार्सल, कूरियर या कस्टम की समस्या",
    authority: "पुलिस, सीबीआई, कस्टम या 'डिजिटल अरेस्ट' का दावा", collect: "पैसे पाने के लिए रिक्वेस्ट स्वीकार या QR स्कैन करने को कहा",
    prize: "इनाम, लॉटरी या कैशबैक का ऑफर", job: "पार्ट-टाइम जॉब या ऑनलाइन टास्क का ऑफर", remote: "रिमोट-एक्सेस ऐप इंस्टॉल करने को कहा",
    app: "लिंक से ऐप इंस्टॉल करवाने की कोशिश", sim: "SIM या मोबाइल नंबर बंद होने की धमकी", invest: "पक्के मुनाफे या 'VIP टिप्स' का निवेश ऑफर",
    secrecy: "कॉल पर बने रहने या बात छिपाने को कहा", transfer: "'वेरिफ़ाई' के लिए पैसे ट्रांसफ़र करने को कहा",
    payin: "कमाई से पहले फ़ीस या डिपॉज़िट माँगा", chatapp: "व्हाट्सऐप या टेलीग्राम पर ले जाने की कोशिश", callback: "किसी नंबर पर कॉल करने को कहा",
    details: "बैंक, कार्ड या आईडी की जानकारी माँगी", refund: "अचानक रिफ़ंड या टैक्स रिफ़ंड की बात", ivr: "'1 दबाएँ' कहकर कस्टमर केयर का दिखावा",
    subscription: "सब्सक्रिप्शन खत्म या पेमेंट की समस्या का बहाना", shortener: "छोटा लिंक जो असली जगह छिपाता है",
    ip: "लिंक एक IP एड्रेस पर जाता है", tld: "लिंक का अंत .xyz/.top जैसा सस्ता है", punycode: "लिंक में नकली (मिलते-जुलते) अक्षर",
    userinfo: "लिंक में छिपी '@' चाल", apk: "लिंक से .apk ऐप फ़ाइल डाउनलोड होती है", hyphens: "लिंक के नाम में बहुत हाइफ़न", http: "लिंक HTTPS नहीं है",
    fakegov: "सरकारी साइट जैसा दिखता है पर .gov.in नहीं है", brand: "किसी असली कंपनी का नाम नकली साइट पर",
  },
};

const signKey = (id = "") => (id.startsWith("brand-") ? "brand" : id);

export function defang(address = "") {
  return String(address).replace(/^https?:\/\//i, (m) => m.replace("http", "hxxp")).replace(/\./g, "[.]");
}

// Wrap text to a pixel width using a supplied measure function (used for the image card; testable without a canvas).
export function wrapLines(text, maxWidth, measure) {
  const out = [];
  for (const para of String(text).split("\n")) {
    const words = para.split(/\s+/).filter(Boolean);
    let line = "";
    for (const w of words) {
      const next = line ? `${line} ${w}` : w;
      if (measure(next) <= maxWidth || !line) line = next;
      else { out.push(line); line = w; }
    }
    out.push(line);
  }
  return out;
}

// signs: [{ id?, label, weight? }], strongest first if weights are given. Returns null when there is nothing worth warning about.
export function buildShare({ kind, level, signs = [], lang = "en", address = "" }) {
  const tone = toneFor(kind, level);
  if (!tone) return null;
  const t = T[lang] || T.en;
  const ranked = [...signs].sort((a, b) => (b.weight || 0) - (a.weight || 0));
  const seen = new Set();
  const why = [];
  for (const s of ranked) {
    const key = signKey(s.id);
    const text = (lang !== "en" && SIGNS[lang]?.[key]) || s.label;
    if (!text || seen.has(text)) continue;
    seen.add(text); why.push(text);
    if (why.length === 4) break;
  }
  const title = t.head[tone][kind];
  const todo = [...t.steps[kind], t.paid];
  const addr = kind === "website" && address ? `${t.address}: ${defang(address)}` : "";
  const lines = [title];
  if (addr) lines.push(addr);
  if (why.length) lines.push("", t.why, ...why.map((w) => `- ${w}`));
  lines.push("", t.todo, ...todo.map((w) => `- ${w}`), "", `${t.foot} ${SITE_URL}`);
  return { tone, title, address: addr, why, todo, whyLabel: t.why, todoLabel: t.todo, footer: `${t.foot} ${SITE_URL}`, text: lines.join("\n") };
}

export const whatsappUrl = (text) => `https://wa.me/?text=${encodeURIComponent(text)}`;
