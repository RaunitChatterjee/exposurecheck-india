// "I've been scammed" incident-response planner. Pure functions: nothing is stored or sent anywhere.
// Official facts used: 1930 National Cyber Crime Helpline, cybercrime.gov.in, RBI circular of 6 July 2017
// on limiting customer liability in unauthorised electronic banking transactions.

export const SITUATIONS = [
  { id: "upi", label: "I sent money by UPI or bank transfer to a scammer", money: true },
  { id: "card", label: "Card, net banking or wallet money was taken", money: true },
  { id: "otp", label: "I shared an OTP, PIN, CVV or password", money: false },
  { id: "remote", label: "I installed a screen-sharing or unknown app (AnyDesk, TeamViewer, APK)", money: false },
  { id: "arrest", label: "Someone on a call claims I am under 'digital arrest'", money: false },
  { id: "invest", label: "I paid for a fake job, investment, trading or lottery", money: true },
  { id: "hacked", label: "My email, WhatsApp or social account was taken over", money: false },
  { id: "sextortion", label: "Someone is blackmailing me with photos or videos", money: false },
  { id: "loanapp", label: "A loan app is harassing me or misusing my contacts", money: false },
];

export const TIMING = [
  { id: "hour", label: "Less than 1 hour ago" },
  { id: "day", label: "Earlier today / within 24 hours" },
  { id: "days", label: "1 to 3 days ago" },
  { id: "old", label: "More than 3 days ago" },
];

export const METHODS = [
  { id: "upi", label: "UPI" },
  { id: "imps", label: "IMPS / NEFT / RTGS" },
  { id: "card", label: "Debit or credit card" },
  { id: "netbank", label: "Net banking" },
  { id: "wallet", label: "Wallet (Paytm, etc.)" },
  { id: "other", label: "Crypto, cash or something else" },
];

const L = {
  cyber: { text: "Report at cybercrime.gov.in", href: "https://cybercrime.gov.in" },
  chakshu: { text: "Report the number on Sanchar Saathi (Chakshu)", href: "https://sancharsaathi.gov.in" },
  ncii: { text: "StopNCII.org (hash intimate images so platforms can block them)", href: "https://stopncii.org" },
};

const situation = (id) => SITUATIONS.find((s) => s.id === id);
export const lostMoney = (a) => !!(situation(a.situation)?.money) || a.paid === true;

export function timingBanner(a) {
  if (!lostMoney(a)) return a.situation === "arrest"
    ? { level: "info", text: "Stay calm. No police or agency arrests anyone over a video call or asks for money to 'clear' a case. You can end the call safely." }
    : { level: "info", text: "Act now while the damage is small. The steps below are in the order that helps most." };
  switch (a.timing) {
    case "hour": return { level: "urgent", text: "You are inside the golden hour. Call 1930 right now, before anything else. Reports made quickly give banks and police the best chance to hold the money. It is not guaranteed, but every minute counts." };
    case "day": return { level: "urgent", text: "You are still within the first day. Call 1930 and your bank immediately: money that has not yet moved on can sometimes be held." };
    case "days": return { level: "warn", text: "It has been a few days, so recovery is harder, but report anyway. Reporting inside 3 working days also matters for your bank's liability rules." };
    default: return { level: "warn", text: "Recovery is less likely after several days, but reporting is still worth it: it can stop the scammer's accounts and protect others. Report today." };
  }
}

export function liabilityNote(a) {
  if (!lostMoney(a)) return null;
  return {
    title: "What the RBI rules say about your loss",
    points: [
      "If the transaction was unauthorised (you did not approve it) and the fault is neither yours nor the bank's, your liability is zero if you report to the bank within 3 working days.",
      "Reporting in 4 to 7 working days can leave you liable for a limited amount, depending on your account type. After 7 working days it follows your bank's own policy.",
      "Banks are expected to credit the disputed amount (a 'shadow reversal') within 10 working days of your report, then complete the investigation.",
      "Important caveat: if you yourself entered the PIN, shared an OTP or approved the payment because you were deceived, the bank may treat it as authorised. You can still report and ask the bank to trace the money, but a refund is not guaranteed.",
      "This is a plain-language summary, not legal advice. Ask your bank for its customer liability policy in writing.",
    ],
  };
}

const step = (title, detail, extra = {}) => ({ title, detail, ...extra });

export function buildPlan(a) {
  const steps = [];
  const money = lostMoney(a);
  const sid = a.situation;
  const urgentMoney = money && (a.timing === "hour" || a.timing === "day" || a.timing === "days");

  if (money) {
    steps.push(step("Call 1930 (National Cyber Crime Helpline)", "Tell them what happened, the amount, the time, and the account or UPI ID the money went to. Note the acknowledgement number they give you.", { call: "1930", urgent: urgentMoney }));
    steps.push(step("Call your bank's fraud line and ask them to act", "Say clearly: 'I am a victim of online fraud. Please block my card and online access, record a fraud complaint, and mark the beneficiary account for review.' Ask for a complaint reference number in writing or by SMS.", { urgent: urgentMoney }));
    steps.push(step("File the complaint on cybercrime.gov.in", "Use 'Report Financial Fraud' (or 'Report other cybercrime'). Include transaction IDs, the fraud account details, and screenshots. Use the complaint text generated below.", { link: L.cyber }));
    steps.push(step("Send your bank a written complaint", "Email your home branch or the bank's grievance address and keep the sent copy. Use the letter generated below. Written notice starts the clock on the RBI timelines."));
  }

  if (sid === "upi" || sid === "card") {
    steps.push(step("Secure your payment apps and cards", "Block or hot-list the card in your bank app, change your UPI PIN and net banking password from a device you trust, and log out other sessions if the app lets you."));
  }
  if (sid === "otp") {
    steps.push(step("Block the card or account you shared details for", "Call the bank's helpline or use the app to block the card, then change the UPI PIN, net banking password and any password that matches the one you shared."));
    steps.push(step("Check for money already gone", "Open your bank and UPI apps and look at the last 24 hours of transactions. If you see anything you did not do, treat it as a loss and follow the steps above."));
  }
  if (sid === "remote") {
    steps.push(step("Disconnect first", "Turn on aeroplane mode or switch off Wi-Fi and mobile data. This cuts the scammer's live access.", { urgent: true }));
    steps.push(step("Remove the app and its permissions", "Uninstall AnyDesk, TeamViewer, QuickSupport or any unknown APK. In Settings, remove any 'accessibility' and 'device admin' permissions it was given. If the phone still behaves oddly, back up photos and do a factory reset."));
    steps.push(step("Change passwords from a different, clean device", "Start with email, then banking, UPI and social accounts. Treat anything you typed or saw while the app was open as exposed."));
    steps.push(step("Check your bank and UPI apps for unfamiliar activity", "Look for new payees, new devices linked, and small test payments. Report any you did not make using the steps above."));
  }
  if (sid === "arrest") {
    steps.push(step("End the call and do not pay anything", "CBI, ED, police, customs and courts do not conduct 'digital arrests', do not interrogate by video call, and never ask you to move money to 'verify' it. Hang up, block the number, and do not keep the call on in the background."));
    steps.push(step("Tell a family member or friend now", "These scams rely on isolating you. Talking to someone you trust breaks the script."));
    steps.push(step("Report the number", "Report the calling number and any messages.", { link: L.chakshu }));
    steps.push(step("If you already shared documents", "Treat your Aadhaar, PAN or bank details as exposed: watch your accounts, and consider locking your Aadhaar biometrics on myAadhaar."));
  }
  if (sid === "invest") {
    steps.push(step("Stop paying, whatever they say", "Fees to 'release' profits, taxes, or 'unfreeze' an account are part of the scam. Also be wary of anyone who offers to recover your money for a fee: that is a second scam."));
    steps.push(step("Leave the groups, but save everything first", "Screenshot the chats, profiles, app pages, payment receipts and websites before you exit or they delete content."));
  }
  if (sid === "hacked") {
    steps.push(step("Take the account back", "Use the platform's 'forgot password' or account recovery flow. For WhatsApp, re-register your number and turn on two-step verification; for Google, use the recovery page and review recent activity."));
    steps.push(step("Lock it down", "Set a new unique password, turn on two-factor authentication, sign out all other devices, and in email check forwarding rules and recovery email or phone for changes."));
    steps.push(step("Warn your contacts", "Tell people not to open links or send money if the hijacked account asked them to."));
    steps.push(step("Check other accounts that use the same password", "Change them too, starting with email and banking."));
    steps.push(step("Report it", "File the incident on the national portal, especially if money, impersonation or blackmail was involved.", { link: L.cyber }));
  }
  if (sid === "sextortion") {
    steps.push(step("Do not pay and do not send more", "Paying almost never ends it; it usually leads to more demands. Stop replying to the account but do not delete the chat yet."));
    steps.push(step("Save the evidence", "Screenshot messages, profile, number, payment details and links. Note dates and times."));
    steps.push(step("Report to the platform and the police", "Report and block the account on the app. File a report on the national portal; reports can be made without revealing your identity to the public.", { link: L.cyber }));
    steps.push(step("Stop the images spreading", "If intimate images exist or are threatened, you can hash them privately so participating platforms block them.", { link: L.ncii }));
    steps.push(step("Tell someone you trust", "This is a crime committed against you. You are not to blame. If you feel overwhelmed, talk to a trusted person or a counsellor."));
  }
  if (sid === "loanapp") {
    steps.push(step("Do not pay extra or 'settlement' money to stop threats", "Illegal loan apps keep raising demands. Pay only what you can verify you actually borrowed, and only through proper channels."));
    steps.push(step("Save evidence, then remove the app", "Screenshot threats, call logs and the app listing. Then uninstall it and revoke its contacts, photos and storage permissions."));
    steps.push(step("Tell your contacts", "A short message that they may receive false messages about you removes the scammers' main pressure."));
    steps.push(step("Report", "File a complaint with the portal and report the app on the Play Store.", { link: L.cyber }));
  }

  if (!money && sid !== "arrest" && sid !== "hacked" && sid !== "sextortion" && sid !== "loanapp") {
    steps.push(step("File a report anyway", "Even with no money lost, a report on the national portal helps link this attempt to others and protects you if it escalates.", { link: L.cyber }));
  }

  steps.push(step("Watch your credit and accounts for the next 90 days", "Check bank statements weekly. Consider checking your credit report for loans you did not take."));

  return steps.map((s, i) => ({ ...s, n: i + 1 }));
}

export function evidenceList(a) {
  const base = ["Screenshots of messages, chats, call logs and the scammer's profile or number", "The phone number, UPI ID, bank account or website the scammer used"];
  if (lostMoney(a)) base.push("Transaction ID / UTR, date, time and amount for each payment", "Bank statement showing the debits", "Your complaint reference numbers (1930, bank, portal)");
  if (a.situation === "remote") base.push("Name of the app that was installed and when");
  return base;
}

export const DONTS = [
  "Do not delete chats, call logs or the app until the evidence is saved.",
  "Do not pay anyone who promises to recover your money. Genuine recovery goes through your bank and the police.",
  "Do not search for 'bank customer care' on a search engine or social media; use the number on your card or bank's official app.",
  "Do not share OTP, PIN or CVV with anyone who 'helps' you after a fraud.",
];

const v = (x, fallback) => (x && String(x).trim() ? String(x).trim() : fallback);
const inr = (x) => (x && String(x).trim() ? `₹${String(x).trim().replace(/^₹\s*/, "")}` : "[amount]");
const sitText = {
  upi: "I transferred money by UPI/bank transfer after being deceived by a fraudster.",
  card: "Money was debited from my card, net banking or wallet without my authorisation.",
  otp: "I was tricked into sharing a one-time password or card/UPI detail, after which my account was used.",
  remote: "A fraudster got remote access to my device through an application and moved money from my account.",
  arrest: "I received a call from persons impersonating law-enforcement officers who threatened me with 'digital arrest' and demanded money.",
  invest: "I paid money to a fraudulent job, investment, trading or lottery scheme.",
  hacked: "My online account was taken over by an unauthorised person.",
  sextortion: "I am being blackmailed by an unknown person with intimate images or videos.",
  loanapp: "An illegal loan application is harassing me and misusing my contact data.",
};

export function buildComplaint(a, d = {}) {
  return [
    "Subject: Online financial fraud complaint",
    "",
    `Incident date and time: ${v(d.when, "[date and time]")}`,
    `Amount lost: ${inr(d.amount)}`,
    `Payment method: ${v(d.method, "[UPI / card / net banking / other]")}`,
    `Transaction ID / UTR: ${v(d.txn, "[transaction id]")}`,
    `Fraudster's UPI ID / account / phone number: ${v(d.payee, "[details]")}`,
    "",
    "What happened:",
    sitText[a.situation] || "[describe what happened]",
    v(d.story, "[Describe in order: how the scammer contacted you, what they said, what you did, and when you noticed.]"),
    "",
    "Actions taken so far:",
    `- Called 1930 (acknowledgement no: ${v(d.ack1930, "[number]")})`,
    `- Informed my bank (reference no: ${v(d.bankRef, "[number]")})`,
    "",
    "I request that the beneficiary account(s) be examined and any remaining funds be held. I can provide screenshots, bank statements and further details on request.",
  ].join("\n");
}

export function buildBankLetter(a, d = {}, kind = "unauthorised") {
  const head = [
    "To,",
    "The Branch Manager / Nodal Officer (Grievance)",
    v(d.bank, "[Bank name]"),
    "",
    `Date: ${v(d.today, "[date]")}`,
    `Subject: Report of fraudulent transaction(s) on account ${v(d.account, "[account number]")}`,
    "",
    "Dear Sir/Madam,",
    "",
  ];
  const facts = [
    `Transaction details: ${inr(d.amount)} on ${v(d.when, "[date and time]")} via ${v(d.method, "[mode]")}, transaction ID ${v(d.txn, "[id]")}, beneficiary ${v(d.payee, "[beneficiary details]")}.`,
    "",
  ];
  const body = kind === "unauthorised"
    ? [
        "I am reporting an unauthorised electronic transaction on my account. I did not authorise it and I have not shared my credentials with anyone who should have them.",
        "",
        ...facts,
        "Under the RBI circular on limiting the liability of customers in unauthorised electronic banking transactions (6 July 2017), I request that you:",
        "1. Block my card, net banking and UPI access to prevent further loss.",
        "2. Credit the disputed amount to my account within 10 working days and confirm the shadow reversal.",
        "3. Provide me with the transaction logs and your investigation findings.",
        "4. Confirm in writing the complaint number and the date and time of my first report.",
      ]
    : [
        "I am reporting that I was deceived by a fraudster into making the payment described below. I have reported this to the National Cyber Crime Helpline (1930) and on cybercrime.gov.in.",
        "",
        ...facts,
        "I request that you:",
        "1. Immediately contact the beneficiary bank and request that the beneficiary account be put on hold or the funds be frozen, to the extent permitted.",
        "2. Record this as a fraud complaint and give me a reference number.",
        "3. Block my card and online access to prevent further loss, and review the account for other suspicious activity.",
        "4. Share the status of the action taken, and cooperate with the police investigation.",
      ];
  const tail = ["", `Cyber complaint / acknowledgement number: ${v(d.ack1930, "[number]")}`, "", "Yours faithfully,", v(d.name, "[Your name]"), v(d.phone, "[Registered mobile number]")];
  return [...head, ...body, ...tail].join("\n");
}
