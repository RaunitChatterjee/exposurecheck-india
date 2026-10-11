import { useEffect, useState } from "react";
import { getStats, scan } from "./api.js";
import ScanForm from "./components/ScanForm.jsx";
import Report from "./components/Report.jsx";
import Transparency from "./components/Transparency.jsx";
import PasswordCheck from "./components/tools/PasswordCheck.jsx";
import ScamChecker from "./components/tools/ScamChecker.jsx";
import HeaderAnalyzer from "./components/tools/HeaderAnalyzer.jsx";

const TABS = [
  { id: "breach", label: "Email breaches" },
  { id: "password", label: "Password check" },
  { id: "message", label: "Scam message check" },
  { id: "headers", label: "Email header analysis" },
];

function Mark() {
  return (
    <svg className="mark" viewBox="0 0 32 32" aria-hidden="true">
      <rect width="32" height="32" rx="7" fill="currentColor" />
      <path d="M16 6.5l8 3v6.2c0 4.8-3.3 8.6-8 10.3-4.7-1.7-8-5.5-8-10.3V9.5z" fill="none" stroke="var(--on-brand)" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M12.5 16l2.5 2.5 4.5-5" fill="none" stroke="var(--gold)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function App() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  const [cooldown, setCooldown] = useState(0);
  const [tab, setTab] = useState("breach");

  useEffect(() => { getStats().then(setStats); }, []);
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  async function onScan(email, domain) {
    setLoading(true); setError(null); setReport(null);
    try {
      setReport(await scan(email, domain));
      getStats().then(setStats);
    } catch (e) {
      setError(e.message);
      if (e.retryAfter) setCooldown(e.retryAfter);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <header className="topbar">
        <div className="wrap topbar-in">
          <span className="brand"><Mark />ExposureCheck India</span>
          <span className="tag">Free. No signup. Nothing stored.</span>
        </div>
      </header>
      <nav className="tabs" aria-label="Tools">
        <div className="wrap tabs-in" role="tablist">
          {TABS.map((t) => (
            <button key={t.id} role="tab" aria-selected={tab === t.id} className={`tab ${tab === t.id ? "tab-on" : ""}`} onClick={() => setTab(t.id)}>{t.label}</button>
          ))}
        </div>
      </nav>
      <main className="wrap">
        {tab === "password" && <PasswordCheck />}
        {tab === "message" && <ScamChecker />}
        {tab === "headers" && <HeaderAnalyzer />}
        {tab === "breach" && (
          <>
        {!report && (
          <section className="hero">
            <h1>Find out what the internet already knows about your email.</h1>
            <p>We check known data breaches, explain what an attacker could do with what leaked, and give you next steps that work in India.</p>
          </section>
        )}
        <ScanForm onScan={onScan} loading={loading} cooldown={cooldown} compact={!!report} />
        {error && <div className="notice notice-error" role="alert">{error}</div>}
        {loading && <p className="status" aria-live="polite">Checking public sources. This can take up to 20 seconds.</p>}
        {report && <Report report={report} />}
        <Transparency stats={stats} />
          </>
        )}
      </main>
      <footer className="footer">
        <div className="wrap">An open-source learning project built on public data sources. It gives guidance, not a guarantee of safety.</div>
      </footer>
    </>
  );
}
