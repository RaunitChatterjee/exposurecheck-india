// "Would you fall for this?" quiz. Pure data and functions; nothing is stored or sent anywhere.
// Every message and call below is invented for teaching; none is a real person's message.
// Facts used: "digital arrest" is not a legal procedure in India; you never need a UPI PIN to receive money;
// banks and other organisations do not ask for OTPs; 1930 is the National Cyber Crime Helpline.

export const SCENARIOS = [
  {
    id: "q1", channel: "Video call", answer: "scam",
    text: "A video call from an \"Inspector Mehra, Mumbai Cyber Cell\":\n\"A parcel in your name with banned drugs was seized. You are under digital arrest. Stay on this video call and do not tell anyone. Transfer ₹1,20,000 to the RBI verification account to clear your name.\"",
    tell: "\"Digital arrest\", secrecy and a \"verification account\"",
    why: "There is no such thing as digital arrest in India. No police force, court or agency arrests or interrogates anyone over a call, forbids you to tell family, or asks you to move money to a \"safe\" or \"RBI\" account.",
    todo: "Hang up, tell someone at home, and call 1930 if you have paid.",
  },
  {
    id: "q2", channel: "SMS", answer: "genuine",
    text: "Rs 1,250.00 debited from A/c XX4821 on 14-Oct via UPI to ZOMATO. Avl bal Rs 10,320. Not you? Call the number on the back of your card.",
    tell: "It asks nothing of you and has no link",
    why: "This is the normal shape of a bank alert: the amount, the last digits, no link, no request for an OTP, and a pointer to the number on your own card. If you did not make the payment, call that number, not one from a message.",
    todo: "Check the payment in your bank's app. If it is not yours, call the number on the back of your card.",
  },
  {
    id: "q3", channel: "SMS", answer: "scam",
    text: "Dear customer, your SBI YONO account will be blocked today. Update KYC now: http://sbi-yono-kyc.top/login",
    tell: "A threat, a deadline and a link on a .top address",
    why: "Banks do not block accounts by SMS or ask you to fix KYC through a link. Real bank websites now end in .bank.in, and this one is on a cheap .top address pretending to be SBI.",
    todo: "Do not tap the link. Open your bank's app or visit a branch to check your KYC.",
  },
  {
    id: "q4", channel: "SMS", answer: "genuine",
    text: "123456 is your OTP for login to Flipkart. Do not share this OTP with anyone. Valid for 10 minutes.",
    tell: "You just tried to log in, and it tells you not to share",
    why: "An OTP you asked for is normal. It becomes dangerous the moment someone asks you to read it out. If you did not just try to log in, ignore it and consider changing your password.",
    todo: "Use it only on the site or app where you just asked for it. Never read it to a caller.",
  },
  {
    id: "q5", channel: "Phone call (Hinglish)", answer: "scam",
    text: "\"Sir, maine galti se aapke number par ₹15,000 bhej diye. Aapko ek request aayegi, use accept karke apna UPI PIN daal dijiye, paisa wapas aa jayega.\"",
    tell: "Asks you to approve a request and enter your PIN to receive money",
    why: "You never need a UPI PIN to receive money. A PIN is only for sending. That \"request\" is a collect request that takes money out of your account.",
    todo: "Do not approve anything. If money really arrived by mistake, the sender should raise it with their bank.",
  },
  {
    id: "q6", channel: "SMS", answer: "scam",
    text: "Dear consumer, your electricity will be disconnected tonight at 9.30 pm because last month's bill is not updated. Contact our officer immediately: 98XXXXXX10",
    tell: "A same-night cut-off and a personal mobile number to call",
    why: "Electricity companies do not cut connections the same night through a personal mobile number, and they do not take payment over a call. The officer's number leads to a scammer who asks you to install an app or pay.",
    todo: "Check your bill in the official app or website and pay only there. Report the number on Sanchar Saathi.",
  },
  {
    id: "q7", channel: "WhatsApp", answer: "scam",
    text: "Hi! Part-time job: earn ₹3,000 a day by liking YouTube videos. Join our Telegram group for tasks. A small deposit unlocks higher-paying tasks.",
    tell: "Easy money, and a deposit to unlock more",
    why: "Genuine employers do not pay for liking videos or ask you to deposit money to earn. Early small payouts are bait; the deposits keep growing and the money is never returned.",
    todo: "Do not join or pay. Block the number. If you already paid, call 1930.",
  },
  {
    id: "q8", channel: "SMS", answer: "genuine",
    text: "Your Amazon order #402-1234567 has shipped and will arrive by Friday. Track it in the Amazon app.",
    tell: "Nothing is asked of you: no link, no payment, no details",
    why: "This message only informs you and points to the app you already use. Scam parcel messages ask for a fee, a link or your details. If you were not expecting an order, check the app yourself instead of replying.",
    todo: "Track it in the app if you ordered something. Ignore it if you did not.",
  },
  {
    id: "q9", channel: "Resale site chat", answer: "scam",
    text: "Buyer: \"I'll pay ₹8,000 for the sofa. I've sent you a QR code. Just scan it and enter your PIN to receive the money.\"",
    tell: "Scan a QR and enter your PIN to receive money",
    why: "A QR code or PIN is needed to send money, never to receive it. Scanning this one pays the buyer, not you.",
    todo: "Do not scan. Share your UPI ID or ask for a normal transfer, and confirm the money arrived in your account before handing over anything.",
  },
  {
    id: "q10", channel: "Phone call", answer: "scam",
    text: "\"This is Airtel customer care. Your SIM will be blocked in 2 hours. Install the AnyDesk app and tell me the 9-digit code so I can fix it.\"",
    tell: "A SIM-block threat and a request to install a remote-access app",
    why: "AnyDesk and similar apps let the caller see and control your phone, including your banking apps and OTPs. Telecom companies do not fix SIM issues by asking you to install them.",
    todo: "Hang up. If you installed it, switch on airplane mode, uninstall it and call 1930 if money moved.",
  },
];

export const TOTAL = SCENARIOS.length;

export function gradeAnswer(scenario, choice) {
  return { correct: scenario.answer === choice, expected: scenario.answer };
}

export function scoreQuiz(answers = {}) {
  let correct = 0;
  const missed = [];
  for (const s of SCENARIOS) {
    if (answers[s.id] === s.answer) correct += 1;
    else if (answers[s.id]) missed.push(s);
  }
  const answered = Object.keys(answers).filter((k) => SCENARIOS.some((s) => s.id === k)).length;
  return { correct, answered, total: TOTAL, missed, band: bandFor(correct) };
}

export function bandFor(correct) {
  if (correct >= 9) return { id: "sharp", label: "Sharp eyes", note: "You spotted almost everything. Share it with someone who would not." };
  if (correct >= 7) return { id: "good", label: "Good instincts", note: "A couple slipped past. Look at the ones you missed below." };
  if (correct >= 5) return { id: "gaps", label: "Some gaps", note: "Very common. The tells below are the ones to remember." };
  return { id: "learn", label: "Worth a closer look", note: "Scammers design these to work on busy, careful people too. The tells below will help." };
}

export function shareScore(correct, total = TOTAL, url = "https://exposurecheck-india.vercel.app") {
  return `I got ${correct} out of ${total} on "Would you fall for this?", a quiz on Indian phone and message scams. Can you beat it? It is free and nothing is saved: ${url}`;
}
