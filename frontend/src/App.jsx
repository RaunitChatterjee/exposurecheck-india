import { useEffect, useState } from "react";
import { getStats, scan } from "./api.js";
import ScanForm from "./components/ScanForm.jsx";
import Report from "./components/Report.jsx";
import Transparency from "./components/Transparency.jsx";

export default function App() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);

  useEffect(() => { getStats().then(setStats); }, []);

  async function onScan(email, domain) {
    setLoading(true); setError(null); setReport(null);
    try {
      setReport(await scan(email, domain));
      getStats().then(setStats);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <header className="topbar">
        <div className="wrap topbar-in">
          <span className="brand"><span className="logo" aria-hidden="true" />ExposureCheck <b>India</b></span>
          <span className="tag">Free · No signup · Nothing stored</span>
        </div>
      </header>
      <main className="wrap">
        {!report && (
          <section className="hero">
            <h1>Has your email been exposed in a data breach?</h1>
            <p>Get a plain-language report on what leaked, what an attacker can do with it, and exactly what to do next in India.</p>
          </section>
        )}
        <ScanForm onScan={onScan} loading={loading} compact={!!report} />
        {error && <div className="alert alert-error" role="alert">{error}</div>}
        {loading && <p className="muted center" aria-live="polite">Scanning public sources… this can take up to 20 seconds.</p>}
        {report && <Report report={report} />}
        <Transparency stats={stats} />
      </main>
      <footer className="footer">
        <div className="wrap">
          ExposureCheck India is an open-source educational tool. It only uses public data sources and gives guidance, not a guarantee of safety.
        </div>
      </footer>
    </>
  );
}
