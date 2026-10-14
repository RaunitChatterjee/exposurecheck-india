// "I'm on a call right now" mode. Pure data and functions; nothing is stored or sent anywhere.
// Facts used: 1930 National Cyber Crime Helpline, cybercrime.gov.in, Sanchar Saathi (Chakshu), UIDAI biometric lock.
// "Digital arrest" is not a legal procedure in India: no agency arrests or investigates people over a video call.

export const TELLS = [
  { id: "stay", label: "They told me not to hang up or to stay on video", why: "Real officials do not need you glued to a call. Scammers keep you on the line so you cannot think or ask anyone." },
  { id: "secret", label: "They told me not to tell my family or anyone", why: "Secrecy is the scam's main tool. Genuine cases never forbid you from speaking to a family member or lawyer." },
  { id: "money", label: "They asked me to move money to a 'safe', 'RBI' or 'verification' account", why: "No bank, police force or regulator has a 'safe account'. Your money is not safer in someone else's account." },
  { id: "arrest", label: "They said I will be arrested, my SIM or account will be blocked right now", why: "Legitimate agencies send written notices and give you time. Panic and a ticking clock are the scammer's script." },
  { id: "otp", label: "They asked for an OTP, PIN, CVV, card number or password", why: "No genuine caller needs these. Banks print this warning on every OTP message." },
  { id: "app", label: "They asked me to install an app or share my screen", why: "Screen-sharing apps (AnyDesk, TeamViewer, QuickSupport) let the caller see and control your phone and banking apps." },
  { id: "pay", label: "They asked me to pay a fee, fine or deposit by UPI, QR or transfer", why: "Fines and clearance fees are not collected through personal UPI IDs or WhatsApp QR codes." },
  { id: "id", label: "They already know my name, Aadhaar or address, so it must be real", why: "Leaked data makes this easy. Knowing your details proves nothing about who is calling." },
];

export const SCENARIOS = [
  {
    id: "arrest", label: "Police, CBI, NCB, customs, TRAI or a court says I am under arrest or in a case",
    truth: "This is the 'digital arrest' scam. There is no such thing in Indian law. No agency arrests, interrogates or 'verifies' anyone over WhatsApp, Skype or a video call, and none asks you to transfer money.",
    say: {
      en: "I will not continue this call. If there is a case, I will go to my local police station or contact the agency on its official number. Goodbye.",
      hinglish: "Main ye call aage nahi chalaunga/chalaungi. Agar koi case hai to main khud thane jaakar ya official number par baat karunga/karungi. Dhanyavaad.",
      hi: "यह कॉल यहीं खत्म होती है। अगर कोई मामला है तो मैं खुद थाने जाकर या आधिकारिक नंबर पर बात कर लूँगा/लूँगी। धन्यवाद।",
    },
    steps: ["Hang up. Do not call the number back.", "Tell a family member or neighbour right now, even if the caller said not to.", "Call 1930 if you have shared any detail or paid anything."],
    never: ["Do not stay on video 'for verification'.", "Do not move money to any 'safe' or 'RBI' account.", "Do not share Aadhaar, PAN or bank details."],
  },
  {
    id: "bank", label: "A 'bank officer' says my KYC, card or account has a problem",
    truth: "Banks do not block accounts over a phone call or ask you to fix KYC through a link or app. They never ask for OTP, PIN or CVV.",
    say: {
      en: "I will contact my bank myself using the number on the back of my card. Goodbye.",
      hinglish: "Main apne bank ko card ke peeche wale number par khud call karunga/karungi. Dhanyavaad.",
      hi: "मैं अपने बैंक को कार्ड के पीछे लिखे नंबर पर खुद फोन करूँगा/करूँगी। धन्यवाद।",
    },
    steps: ["Hang up.", "Call the number printed on your card or passbook, from a different phone if you can.", "Check your bank app for any unfamiliar transaction."],
    never: ["Do not share an OTP, PIN, CVV or password.", "Do not tap links or install apps they send."],
  },
  {
    id: "utility", label: "Electricity, gas, SIM or telecom: 'your connection will be cut tonight'",
    truth: "Utilities and telecom companies do not disconnect services through a personal mobile number or ask you to pay a pending amount on a call. TRAI and DoT do not call to threaten disconnection.",
    say: {
      en: "I will check my bill in the official app and pay only there. Goodbye.",
      hinglish: "Main official app me apna bill khud check karunga/karungi. Dhanyavaad.",
      hi: "मैं आधिकारिक ऐप में अपना बिल खुद देख लूँगा/लूँगी। धन्यवाद।",
    },
    steps: ["Hang up.", "Open your electricity or operator's official app or website (type it yourself) and check the bill.", "Report the number on Sanchar Saathi (Chakshu)."],
    never: ["Do not call the number in their message.", "Do not install an app they ask for 'to update your connection'."],
  },
  {
    id: "parcel", label: "A courier or customs says a parcel in my name has drugs, or needs a fee",
    truth: "Courier companies and customs do not phone you to hand your case to the police, and they do not collect fees on personal UPI IDs. A parcel you never ordered is a standard scam opener.",
    say: {
      en: "I did not send or order any parcel. I will check with the courier company through its official website. Goodbye.",
      hinglish: "Maine koi parcel nahi bheja/mangwaya. Main courier ki official website par khud check karunga/karungi. Dhanyavaad.",
      hi: "मैंने कोई पार्सल नहीं भेजा या मँगवाया। मैं कूरियर की आधिकारिक वेबसाइट पर खुद जाँच लूँगा/लूँगी। धन्यवाद।",
    },
    steps: ["Hang up.", "If you really are expecting a parcel, track it on the courier's own site or app.", "Treat any 'transfer to the police' call that follows as the arrest scam."],
    never: ["Do not pay a 'clearance' or 'release' fee.", "Do not give Aadhaar or passport details."],
  },
  {
    id: "remote", label: "'Tech support' or 'customer care' wants me to install an app or share my screen",
    truth: "Once you install a remote-access app and share the code, the caller can see your screen, read OTPs and move money from your banking apps.",
    say: {
      en: "I will not install anything. I will contact the company through its official website. Goodbye.",
      hinglish: "Main koi app install nahi karunga/karungi. Company ki official website se khud sampark karunga/karungi. Dhanyavaad.",
      hi: "मैं कोई ऐप इंस्टॉल नहीं करूँगा/करूँगी। कंपनी की आधिकारिक वेबसाइट से खुद संपर्क करूँगा/करूँगी। धन्यवाद।",
    },
    steps: ["Hang up.", "If you already installed AnyDesk, TeamViewer or a similar app, switch on airplane mode and uninstall it.", "Do not open banking or UPI apps until it is gone."],
    never: ["Do not read out the 9-digit code the app shows.", "Do not open your banking app while they are connected."],
  },
  {
    id: "refund", label: "Refund, 'I sent money by mistake', or a collect request I must approve",
    truth: "You never need to enter a UPI PIN, scan a QR code or approve a request to receive money. A PIN is only for sending.",
    say: {
      en: "If you sent money by mistake, please raise it with your bank. I will not approve any request. Goodbye.",
      hinglish: "Agar galti se paisa gaya hai to apne bank se baat kijiye. Main koi request approve nahi karunga/karungi. Dhanyavaad.",
      hi: "अगर गलती से पैसे गए हैं तो अपने बैंक से बात कीजिए। मैं कोई रिक्वेस्ट मंज़ूर नहीं करूँगा/करूँगी। धन्यवाद।",
    },
    steps: ["Hang up.", "Check your bank balance in the official app. If money truly arrived, leave it and tell your bank.", "Decline any pending collect request in your UPI app."],
    never: ["Do not enter your UPI PIN to 'receive' money.", "Do not scan a QR code they send."],
  },
  {
    id: "family", label: "A voice or message says a relative is in trouble and I must send money now",
    truth: "Scammers use panic, a bad line and sometimes a cloned voice. A real emergency can survive a 60-second check.",
    say: {
      en: "I will call them back on their own number right now. Goodbye.",
      hinglish: "Main unhe unke apne number par abhi call karta/karti hu. Dhanyavaad.",
      hi: "मैं उन्हें उनके अपने नंबर पर अभी फोन करता/करती हूँ। धन्यवाद।",
    },
    steps: ["Hang up and call the relative on the number you already have.", "If they do not answer, call another family member who would know.", "Agree a family code word for future emergencies."],
    never: ["Do not send money to 'a lawyer', 'a hospital' or 'a friend' before verifying.", "Do not trust the caller's number or photo."],
  },
  {
    id: "blackmail", label: "A video call shows nudity and now they threaten to share it",
    truth: "This is sextortion. Paying does not end it; the demands usually grow. You are the victim, and it is a reportable crime.",
    say: {
      en: "I will not pay. I am reporting this to the cyber crime helpline. Goodbye.",
      hinglish: "Main paisa nahi dunga/dungi. Main cyber crime helpline par report kar raha/rahi hu. Dhanyavaad.",
      hi: "मैं पैसे नहीं दूँगा/दूँगी। मैं साइबर क्राइम हेल्पलाइन में शिकायत कर रहा/रही हूँ। धन्यवाद।",
    },
    steps: ["Stop replying and do not pay. Block the number.", "Take screenshots of the chat, number, profile and any payment details.", "Call 1930 and report at cybercrime.gov.in. Tell one trusted person."],
    never: ["Do not pay or send more photos.", "Do not delete the evidence."],
  },
  {
    id: "invest", label: "A job, investment, trading or lottery that needs a deposit first",
    truth: "Task jobs, 'VIP' stock groups and lotteries that ask for a deposit to unlock earnings or a prize are scams. Early small payouts are bait.",
    say: {
      en: "I am not interested and will not pay anything. Goodbye.",
      hinglish: "Mujhe interest nahi hai, main koi paisa nahi dunga/dungi. Dhanyavaad.",
      hi: "मुझे रुचि नहीं है, मैं कोई पैसा नहीं दूँगा/दूँगी। धन्यवाद।",
    },
    steps: ["Stop sending money, even to 'recover' what you already paid.", "Leave the Telegram or WhatsApp group and block the contact.", "If you paid anything, call 1930."],
    never: ["Do not pay a 'tax' or 'fee' to withdraw your earnings.", "Do not share your bank login."],
  },
  {
    id: "other", label: "None of these, but something feels wrong",
    truth: "A real caller can always wait while you check. Pressure, secrecy and urgency are the common thread in nearly every phone scam.",
    say: {
      en: "I will call back on the official number. Goodbye.",
      hinglish: "Main official number par khud call karunga/karungi. Dhanyavaad.",
      hi: "मैं आधिकारिक नंबर पर खुद फोन करूँगा/करूँगी। धन्यवाद।",
    },
    steps: ["Hang up.", "Look up the organisation's number yourself on its official website or your card or bill.", "Ask a family member before you do anything they asked."],
    never: ["Do not share OTPs, PINs or card details.", "Do not click links or install apps."],
  },
];

export const DONE = [
  { id: "paid", label: "I already sent money" },
  { id: "app", label: "I installed an app or shared my screen" },
  { id: "otp", label: "I shared an OTP or UPI PIN" },
  { id: "card", label: "I shared card details" },
  { id: "idcard", label: "I shared Aadhaar, PAN or ID photos" },
  { id: "oncall", label: "I am still on the call" },
];

export const getScenario = (id) => SCENARIOS.find((s) => s.id === id) || null;

// Verdict from the "signs on this call" checklist. Any single tell is enough to say hang up.
export function tellsVerdict(ids = []) {
  const known = TELLS.filter((t) => ids.includes(t.id));
  if (known.length === 0) return { level: "none", headline: "Tick anything that is happening on this call.", tells: [] };
  if (known.length === 1 && known[0].id === "id") return { level: "warn", headline: "Knowing your details does not make a caller genuine. Hang up and verify yourself.", tells: known };
  return { level: "hangup", headline: known.length === 1 ? "That alone is a scam sign. Hang up." : `${known.length} scam signs on one call. Hang up now.`, tells: known };
}

// Ordered things to do now, most urgent first, based on what has already happened.
export function urgentSteps(doneIds = []) {
  const has = (i) => doneIds.includes(i);
  const out = [];
  if (has("oncall")) out.push({ title: "Hang up now", detail: "Do not call the number back and do not tell them what you will do next." });
  if (has("paid")) out.push({ title: "Call 1930 now", detail: "Give the amount, time, UPI or transaction ID and the receiver's details. The sooner it is reported, the better the chance the money can be frozen.", tel: "1930" });
  if (has("paid") || has("otp") || has("card")) out.push({ title: "Call your bank's official helpline", detail: "Ask them to block the card, UPI or net banking and mark the transaction disputed. Use the number on the back of your card.", });
  if (has("app")) out.push({ title: "Cut off the app", detail: "Turn on airplane mode, then uninstall the screen-sharing or unknown app (Settings, Apps). Do not open banking apps until it is gone, and change passwords from another device." });
  if (has("otp")) out.push({ title: "Change your UPI PIN and passwords", detail: "Reset your UPI PIN and net banking password after the app is removed." });
  if (has("idcard")) out.push({ title: "Protect your identity", detail: "Lock your Aadhaar biometrics on the UIDAI site or mAadhaar app, and check which SIMs are in your name on Sanchar Saathi." });
  if (doneIds.length > 0) out.push({ title: "Build your complaint", detail: "Use the \"I've been scammed\" tab for a ready-to-send complaint for cybercrime.gov.in and a letter to your bank.", goto: "sos" });
  return out;
}

// A short message the person can send to someone near them while the call is going on, or right after.
export function familyMessage(scenarioId) {
  const s = getScenario(scenarioId);
  const claim = s ? s.label.replace(/\s*:\s*/g, ", ") : "someone who may be a scammer";
  return `I am getting a suspicious phone call. The caller says: "${claim}". I think it is a scam and I am hanging up. Please call me or come over, and do not send any money on anyone's say-so. If you can, look at https://exposurecheck-india.vercel.app together.`;
}
