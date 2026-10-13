import RiskGauge from "./RiskGauge.jsx";
import BreachList from "./BreachList.jsx";
import DomainPanel from "./DomainPanel.jsx";
import Remediation from "./Remediation.jsx";
import MitrePanel from "./MitrePanel.jsx";

export default function Report({ report, onRetry, onOpenPlanner }) {
  const { breaches, risk } = report;
  const incomplete = breaches.status === "unavailable";
  const headline = incomplete ? "We could not complete the breach check"
    : breaches.count === 0 ? "No known breaches found"
    : `Your email appears in ${breaches.count} known ${breaches.count === 1 ? "breach" : "breaches"}`;

  return (
    <div className="report">
      {incomplete ? (
        <section className="summary incomplete" role="alert">
          <div className="summary-body">
            <h2>{headline}</h2>
            <p>{breaches.message || "The breach database could not be reached."}</p>
            <p><b>This is not a "no breaches" result.</b> We do not know whether your email appears in a breach, so we are not showing a risk score. Try again later; the free breach source has a daily limit.</p>
            {onRetry && <button type="button" className="btn" onClick={onRetry}>Try again</button>}
          </div>
        </section>
      ) : (
        <section className="summary">
          <RiskGauge risk={risk} />
          <div className="summary-body">
            <h2>{headline}</h2>
            {breaches.status === "demo" && (
              <p className="notice notice-demo">Demo data. These fictional sample breaches appear for every email while the server runs in demo mode.</p>
            )}
            <ul className="factors">
              {risk.factors.map((f) => (<li key={f.label}><span>{f.label}</span><b>+{f.points}</b></li>))}
              {risk.factors.length === 0 && <li><span>No risk factors found</span><b>0</b></li>}
            </ul>
          </div>
        </section>
      )}

      {breaches.count > 0 && <BreachList breaches={breaches.breaches} />}
      <Remediation steps={report.remediation} onOpenPlanner={onOpenPlanner} />
      {(report.domain_exposure.status !== "skipped" || report.email_security.status !== "skipped") && (
        <DomainPanel exposure={report.domain_exposure} mail={report.email_security} />
      )}
      {!incomplete && <MitrePanel techniques={report.mitre} />}
      <p className="fine">Report generated {new Date(report.generated_at).toLocaleString("en-IN")}.{breaches.source ? ` Breach data: ${breaches.source}.` : ""} {report.storage_note}</p>
    </div>
  );
}
