// Content for the printable family safety card. Pure data and functions; nothing is stored or sent anywhere.
// Facts: 1930 is the National Cyber Crime Helpline; reports go to cybercrime.gov.in; "digital arrest" is not a legal procedure in India.

export const CARD_LANGS = [
  { id: "en", label: "English" },
  { id: "hinglish", label: "Hinglish" },
  { id: "hi", label: "हिन्दी" },
];

export const CARD = {
  en: {
    title: "Stay safe from phone and online fraud",
    sub: "Keep this card near the phone.",
    rules: [
      ["No one is arrested over a call.", "Police, CBI, courts and customs never arrest or 'verify' anyone on a phone or video call. Hang up."],
      ["Never share an OTP, PIN, CVV or password.", "Not with the bank, not with 'customer care', not with anyone."],
      ["You never need to approve or scan to receive money.", "A UPI PIN is only for sending. A QR code or request that 'gives' you money is a trap."],
      ["Do not install apps others ask for.", "AnyDesk, TeamViewer, QuickSupport or an unknown APK let a stranger control your phone."],
      ["Money gone? Call 1930 at once.", "The sooner you call, the better the chance to freeze it. Then report at cybercrime.gov.in."],
    ],
    first: "Before you do anything: hang up and call a family member.",
    codeTitle: "Our family code word",
    codeHelp: "If someone calls asking for money in an emergency, call them back on their own number and ask for this word.",
    contactsTitle: "Who to call",
    labels: { helpline: "Cyber crime helpline", website: "Report online", bank: "My bank (number on the back of my card)", family: "Family member to call first", name: "Card for" },
  },
  hinglish: {
    title: "Phone aur online fraud se bachein",
    sub: "Is card ko phone ke paas rakhein.",
    rules: [
      ["Call par koi arrest nahi hota.", "Police, CBI, court ya customs phone ya video call par kisi ko arrest ya 'verify' nahi karte. Call kaat dein."],
      ["OTP, PIN, CVV ya password kisi ko na batayein.", "Na bank ko, na 'customer care' ko, kisi ko nahi."],
      ["Paise lene ke liye kuch approve ya scan nahi karna padta.", "UPI PIN sirf paise bhejne ke liye hota hai. Jo QR ya request 'paise dene' ka kahe, wo jaal hai."],
      ["Koi kahe to app install na karein.", "AnyDesk, TeamViewer, QuickSupport ya anjaan APK se koi aur aapka phone chala sakta hai."],
      ["Paisa chala gaya? Turant 1930 par call karein.", "Jitni jaldi call karenge, paisa rukne ke chance utne zyada. Phir cybercrime.gov.in par report karein."],
    ],
    first: "Kuch bhi karne se pehle: call kaat dein aur ghar ke kisi vyakti ko call karein.",
    codeTitle: "Hamara family code word",
    codeHelp: "Agar koi emergency bata kar paise maange, to use uske apne number par wapas call karein aur ye word poochein.",
    contactsTitle: "Kise call karein",
    labels: { helpline: "Cyber crime helpline", website: "Online report", bank: "Mera bank (card ke peeche wala number)", family: "Pehle kisko call karein", name: "Card kiske liye" },
  },
  hi: {
    title: "फोन और ऑनलाइन धोखाधड़ी से बचें",
    sub: "इस कार्ड को फोन के पास रखें।",
    rules: [
      ["कॉल पर किसी को गिरफ़्तार नहीं किया जाता।", "पुलिस, सीबीआई, अदालत या कस्टम फोन या वीडियो कॉल पर किसी को गिरफ़्तार या 'वेरिफ़ाई' नहीं करते। कॉल काट दें।"],
      ["OTP, पिन, CVV या पासवर्ड किसी को न बताएँ।", "न बैंक को, न 'कस्टमर केयर' को, किसी को नहीं।"],
      ["पैसे पाने के लिए कुछ स्वीकार या स्कैन नहीं करना पड़ता।", "UPI पिन सिर्फ़ पैसे भेजने के लिए होता है। जो QR या रिक्वेस्ट 'पैसे देने' की बात करे, वह जाल है।"],
      ["कोई कहे तो ऐप इंस्टॉल न करें।", "AnyDesk, TeamViewer, QuickSupport या अनजान APK से कोई और आपका फोन चला सकता है।"],
      ["पैसे चले गए? तुरंत 1930 पर कॉल करें।", "जितनी जल्दी कॉल करेंगे, पैसे रुकने की उम्मीद उतनी ज़्यादा। फिर cybercrime.gov.in पर शिकायत करें।"],
    ],
    first: "कुछ भी करने से पहले: कॉल काट दें और घर के किसी व्यक्ति को फोन करें।",
    codeTitle: "हमारा पारिवारिक कोड शब्द",
    codeHelp: "अगर कोई आपातकाल बताकर पैसे माँगे, तो उसे उसके अपने नंबर पर वापस कॉल करें और यह शब्द पूछें।",
    contactsTitle: "किसे फोन करें",
    labels: { helpline: "साइबर क्राइम हेल्पलाइन", website: "ऑनलाइन शिकायत", bank: "मेरा बैंक (कार्ड के पीछे लिखा नंबर)", family: "सबसे पहले किसे फोन करें", name: "यह कार्ड किसके लिए" },
  },
};

// Plain-text version for WhatsApp or a message, so the card can be shared without printing.
export function shareText(lang = "en", { name = "", codeWord = "" } = {}) {
  const c = CARD[lang] || CARD.en;
  const lines = [c.title + (name.trim() ? ` (${name.trim()})` : ""), ""];
  c.rules.forEach(([h, d], i) => lines.push(`${i + 1}. ${h} ${d}`));
  lines.push("", c.first);
  if (codeWord.trim()) lines.push("", `${c.codeTitle}: ${codeWord.trim()}`);
  lines.push("", `${c.labels.helpline}: 1930`, `${c.labels.website}: cybercrime.gov.in`);
  return lines.join("\n");
}

// A fresh code word suggestion: two ordinary words, easy to remember, hard to guess from social media.
const A = ["Mango", "Tiger", "Silver", "Monsoon", "Lotus", "Kite", "Cricket", "Saffron", "Jasmine", "River", "Chai", "Peacock"];
const B = ["Window", "Rocket", "Umbrella", "Garden", "Pencil", "Lantern", "Bicycle", "Mirror", "Teapot", "Bridge", "Candle", "Ladder"];
export function suggestCodeWord(rand = Math.random) {
  const pick = (a) => a[Math.min(a.length - 1, Math.floor(rand() * a.length))];
  return `${pick(A)} ${pick(B)}`;
}
