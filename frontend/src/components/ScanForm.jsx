import { useState } from "react";

export default function ScanForm({ onScan, loading, compact }) {
  const [email, setEmail] = useState("");
  const [domain, setDomain] = useState("");
  const [showDomain, setShowDomain] = useState(false);

  function submit(e) {
    e.preventDefault();
    onScan(email.trim(), showDomain ? domain.trim() : "");
  }

  return (
    <form className={`card scan ${compact ? "compact" : ""}`} onSubmit={submit}>
      <label htmlFor="email">Email address</label>
      <div className="row">
        <input id="email" type="email" inputMode="email" autoComplete="email" required maxLength={254}
               placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        <button className="btn" type="submit" disabled={loading || !email}>{loading ? "Scanning…" : "Check exposure"}</button>
      </div>
      <button type="button" className="link" onClick={() => setShowDomain((v) => !v)} aria-expanded={showDomain}>
        {showDomain ? "− Hide domain check" : "+ Also check a domain I own (optional)"}
      </button>
      {showDomain && (
        <div className="domain">
          <label htmlFor="domain">Your domain</label>
          <input id="domain" type="text" autoComplete="off" placeholder="example.com" maxLength={253}
                 value={domain} onChange={(e) => setDomain(e.target.value)} />
          <small className="muted">Checks publicly visible hostnames (certificate logs) and SPF / DKIM / DMARC email protection.</small>
        </div>
      )}
      <small className="muted">We do not store your email or domain. The email is sent to the HaveIBeenPwned API to look up breaches.</small>
    </form>
  );
}
