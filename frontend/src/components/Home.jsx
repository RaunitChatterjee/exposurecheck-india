const CARDS = [
  { tab: "call", title: "I'm on a call right now", text: "A caller says you are under arrest, your account is blocked or a relative is in trouble? Spot the signs, get the exact words to say and what to do next.", urgent: true },
  { tab: "sos", title: "I've been scammed", text: "Money sent, OTP shared or an app installed? Get an ordered plan: who to call first, what to say to your bank, and what proof to keep.", urgent: true },
  { tab: "message", title: "Is this message a scam?", text: "Paste an SMS or WhatsApp message, or drop a screenshot. Works for English, Hinglish and Hindi: KYC threats, digital arrest, customs parcels, electricity cuts, task jobs." },
  { tab: "domain", title: "Is this the real website?", text: "Paste a link or email address. We compare it with official bank, government, courier and app addresses and spot look-alikes. Banks now end in .bank.in." },
  { tab: "family", title: "Family safety card", text: "A printable card for parents and grandparents in English, Hindi or Hinglish: five rules, the 1930 helpline and a family code word." },
  { tab: "upi", title: "What will this UPI QR do?", text: "Upload a QR screenshot or paste a link. See whether it sends money, asks to collect from you, or sets up an auto-debit." },
  { tab: "breach", title: "Has my email leaked?", text: "See which websites and services your email appeared in, then get steps that work in India." },
  { tab: "password", title: "Is my password exposed?", text: "Check a password against known leaks without sending the password anywhere." },
  { tab: "headers", title: "Where did this email come from?", text: "Paste the raw headers of a suspicious email to check who really sent it." },
];

const STEPS = [
  { n: "1", title: "Pick what you need", text: "Choose a tool above. There is nothing to install and no account to make." },
  { n: "2", title: "Paste or upload", text: "Most checks run in your own browser, so the message or QR you give them stays on your device." },
  { n: "3", title: "Get plain-language next steps", text: "Every result explains the warning signs and what to do next, with the 1930 helpline and cybercrime.gov.in where they matter." },
];

export default function Home({ onOpen }) {
  return (
    <>
      <section className="hero">
        <h1>Practical help for online fraud in India.</h1>
        <p>Check a suspicious message, QR code or email, see where your data has leaked, and get step-by-step help if you have already been scammed. Free, no signup, and nothing you paste is stored.</p>
      </section>

      <section className="cards" aria-label="Tools">
        {CARDS.map((c) => (
          <button key={c.tab} type="button" className={`card ${c.urgent ? "card-urgent" : ""}`} onClick={() => onOpen(c.tab)}>
            <h2>{c.title}</h2>
            <p>{c.text}</p>
            <span className="card-go">Open</span>
          </button>
        ))}
      </section>

      <section className="sec">
        <h2>How it works</h2>
        <ol className="how-steps">
          {STEPS.map((s) => (
            <li key={s.n}><span className="step-n" aria-hidden="true">{s.n}</span><div><h3>{s.title}</h3><p>{s.text}</p></div></li>
          ))}
        </ol>
      </section>

      <section className="sec">
        <h2>What happens to your data</h2>
        <dl className="how">
          <dt>Messages, QR codes, headers</dt><dd>Analysed in your browser. They are not sent to any server.</dd>
          <dt>Passwords</dt><dd>Hashed in your browser. Only the first 5 characters of the hash are sent to the Pwned Passwords service, which cannot reveal your password.</dd>
          <dt>Email breach check</dt><dd>Your email is sent through our server to a third-party breach database to find breaches. We do not store or log it. We keep only anonymous daily totals.</dd>
          <dt>Scam response planner</dt><dd>Everything you type stays in your browser.</dd>
        </dl>
        <p className="fine">These tools show warning signs; they cannot prove a message is safe. When in doubt, contact your bank on the number printed on your card, or call 1930 if money has been lost.</p>
      </section>
    </>
  );
}
