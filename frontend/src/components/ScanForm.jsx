import { useState } from "react";

export default function ScanForm({ onScan, loading, cooldown, compact }) {
  const [email, setEmail] = useState("");
  const [domain, setDomain] = useState("");
  const [showDomain, setShowDomain] = useState(false);
  const blocked = loading || cooldown > 0 || !email;

  function submit(e) {
    e.preventDefault();
    if (!blocked) onScan(email.trim(), showDomain ? domain.trim() : "");
  }

  return (
    <form className={`panel scan ${compact ? "scan-compact" : ""}`} onSubmit={submit}>
      <label htmlFor="email">Your email address</label>
      <div className="row">
        <input id="email" type="email" inputMode="email" autoComplete="email" required maxLength={254}
               placeholder="name@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        <button className="btn" type="submit" disabled={blocked}>
          {loading ? "Checking" : cooldown > 0 ? `Try again in ${cooldown}s` : "Check my email"}
        </button>
      </div>
      <button type="button" className="textbtn" onClick={() => setShowDomain((v) => !v)} aria-expanded={showDomain}>
        {showDomain ? "Remove domain check" : "Add a domain you own"}
      </button>
      {showDomain && (
        <div className="domain-field">
          <label htmlFor="domain">Your domain</label>
          <input id="domain" type="text" autoComplete="off" placeholder="example.com" maxLength={253}
                 value={domain} onChange={(e) => setDomain(e.target.value)} />
          <p className="hint">Looks up hostnames in public certificate logs and checks SPF, DKIM and DMARC email protection.</p>
        </div>
      )}
      <p className="hint">Your email is sent to a third-party breach database to find breaches. We never store it.</p>
    </form>
  );
}
