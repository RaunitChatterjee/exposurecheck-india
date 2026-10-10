import RiskGauge from "./RiskGauge.jsx";
import BreachList from "./BreachList.jsx";
import DomainPanel from "./DomainPanel.jsx";
import Remediation from "./Remediation.jsx";
import MitrePanel from "./MitrePanel.jsx";

export default function Report({ report }) {
  const { breaches, risk } = report;
  return (
    <div className="report">
      <section className="card">
        <div className="summary">
          <RiskGauge risk={risk} />
          <div>
            <h2>
              {breaches.status === "unavailable"
                ? "Breach lookup unavailable"
                : breaches.count === 0
                ? "No known breaches found"
                : `Found in ${breaches.count} known breach${breaches.count === 1 ? "" : "es"}`}
            </h2>
            {risk.partial && <p className="alert alert-warn">This score is partial because the breach lookup did not complete.</p>}
            {breaches.message && <p className={`alert ${breaches.status === "demo" ? "alert-demo" : "alert-warn"}`}>{breaches.message}</p>}
            <ul className="factors">
              {risk.factors.map((f) => (<li key={f.label}><span>{f.label}</span><b>+{f.points}</b></li>))}
              {risk.factors.length === 0 && <li><span>No risk factors detected</span><b>0</b></li>}
            </ul>
          </div>
        </div>
      </section>

      <Remediation steps={report.remediation} />
      {breaches.count > 0 && <BreachList breaches={breaches.breaches} />}
      {(report.domain_exposure.status !== "skipped" || report.email_security.status !== "skipped") && (
        <DomainPanel exposure={report.domain_exposure} mail={report.email_security} />
      )}
      <MitrePanel techniques={report.mitre} />
      <p className="muted small">Generated {new Date(report.generated_at).toLocaleString()} · {report.storage_note}</p>
    </div>
  );
}
