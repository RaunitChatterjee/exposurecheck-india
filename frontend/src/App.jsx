import { useEffect, useState } from "react";
import { getStats, scan } from "./api.js";
import ScanForm from "./components/ScanForm.jsx";
import Report from "./components/Report.jsx";
import Transparency from "./components/Transparency.jsx";
import Home from "./components/Home.jsx";
import Loading from "./components/Loading.jsx";
import PasswordCheck from "./components/tools/PasswordCheck.jsx";
import ScamChecker from "./components/tools/ScamChecker.jsx";
import HeaderAnalyzer from "./components/tools/HeaderAnalyzer.jsx";
import UpiInspector from "./components/tools/UpiInspector.jsx";
import IncidentWizard from "./components/tools/IncidentWizard.jsx";
import CallMode from "./components/tools/CallMode.jsx";
import DomainChecker from "./components/tools/DomainChecker.jsx";
import FamilyCard from "./components/tools/FamilyCard.jsx";

const TABS = [
  { id: "home", label: "Home" },
  { id: "call", label: "On a call now", sos: true },
  { id: "sos", label: "I've been scammed", sos: true },
  { id: "breach", label: "Email breach" },
  { id: "password", label: "Password" },
  { id: "message", label: "Scam message" },
  { id: "upi", label: "UPI QR / link" },
  { id: "domain", label: "Real website?" },
  { id: "family", label: "Family card" },
  { id: "headers", label: "Email headers" },
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
  const [tab, setTab] = useState("home");
  const [last, setLast] = useState(null);

  useEffect(() => { getStats().then(setStats); }, []);
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  async function onScan(email, domain) {
    setLast([email, domain]);
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
          <button type="button" className="brand brand-btn" onClick={() => setTab("home")} aria-label="ExposureCheck India home"><Mark />ExposureCheck India</button>
          <span className="tag">Free. No signup. Nothing stored.</span>
        </div>
      </header>
      <nav className="tabs" aria-label="Tools">
        <div className="wrap tabs-in" role="tablist">
          {TABS.map((t) => (
            <button key={t.id} role="tab" aria-selected={tab === t.id} className={`tab ${tab === t.id ? "tab-on" : ""} ${t.sos ? "tab-sos" : ""}`} onClick={() => setTab(t.id)}>{t.label}</button>
          ))}
        </div>
      </nav>
      <main className="wrap">
        {tab === "home" && <Home onOpen={setTab} />}
        {tab === "call" && <CallMode onOpen={setTab} />}
        {tab === "sos" && <IncidentWizard />}
        {tab === "upi" && <UpiInspector />}
        {tab === "domain" && <DomainChecker />}
        {tab === "family" && <FamilyCard />}
        {tab === "password" && <PasswordCheck />}
        {tab === "message" && <ScamChecker />}
        {tab === "headers" && <HeaderAnalyzer />}
        {tab === "breach" && (
          <>
        <section className="tool-head">
          <h1>Has your email leaked?</h1>
          <p>See which websites and services your email appeared in, then get next steps that work in India.</p>
        </section>
        <ScanForm onScan={onScan} loading={loading} cooldown={cooldown} compact={!!report} />
        {error && <div className="notice notice-error" role="alert">{error}</div>}
        {loading && <Loading />}
        {report && !loading && <Report report={report} onRetry={last ? () => onScan(...last) : null} onOpenPlanner={() => setTab("sos")} />}
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
