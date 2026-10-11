import RiskGauge from "./RiskGauge.jsx";
import BreachList from "./BreachList.jsx";
import DomainPanel from "./DomainPanel.jsx";
import Remediation from "./Remediation.jsx";
import MitrePanel from "./MitrePanel.jsx";

export default function Report({ report }) {
  const { breaches, risk } = report;
  const headline =
    breaches.status === "unavailable" ? "The breach lookup did not complete"
    : breaches.count === 0 ? "No known breaches found"
    : `Your email appears in ${breaches.count} known ${breaches.count === 1 ? "breach" : "breaches"}`;

  return (
    <div className="report">
      <section className="summary">
        <RiskGauge risk={risk} />
        <div className="summary-body">
          <h2>{headline}</h2>
          {breaches.status === "demo" && (
            <p className="notice notice-demo">Demo data. These fictional sample breaches appear for every email while the server runs in demo mode.</p>
          )}
          {breaches.status === "unavailable" && (
            <p className="notice notice-warn">{breaches.message} The score below is partial.</p>
          )}
          <ul className="factors">
            {risk.factors.map((f) => (<li key={f.label}><span>{f.label}</span><b>+{f.points}</b></li>))}
            {risk.factors.length === 0 && <li><span>No risk factors found</span><b>0</b></li>}
          </ul>
        </div>
      </section>

      <Remediation steps={report.remediation} />
      {breaches.count > 0 && <BreachList breaches={breaches.breaches} />}
      {(report.domain_exposure.status !== "skipped" || report.email_security.status !== "skipped") && (
        <DomainPanel exposure={report.domain_exposure} mail={report.email_security} />
      )}
      <MitrePanel techniques={report.mitre} />
      <p className="fine">Report generated {new Date(report.generated_at).toLocaleString("en-IN")}.{breaches.source ? ` Breach data: ${breaches.source}.` : ""} {report.storage_note}</p>
    </div>
  );
}
