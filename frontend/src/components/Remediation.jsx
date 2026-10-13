import Section from "./Section.jsx";

const TAG = { 1: "Do now", 2: "Do soon", 3: "This week", 4: "Good to know" };

export default function Remediation({ steps, onOpenPlanner }) {
  return (
    <Section title="What to do next" intro="In order of urgency. Start at the top.">
      <div className="notice notice-error sos-inline">
        <b>Lost money, or a payment you did not make?</b> Contact your bank straight away using the number on your card or in its official app, call <a href="tel:1930"><b>1930</b></a>, and report at <a href="https://cybercrime.gov.in" target="_blank" rel="noopener noreferrer">cybercrime.gov.in</a>.
        {onOpenPlanner && <> <button type="button" className="textbtn textbtn-inline" onClick={onOpenPlanner}>Open the step-by-step planner</button></>}
      </div>
      <ol className="steps">
        {steps.map((s, i) => (
          <li key={s.title}>
            <span className="step-n" aria-hidden="true">{i + 1}</span>
            <div>
              <span className={`tag tag-${s.priority}`}>{TAG[s.priority]}</span>
              <h3>{s.title}</h3>
              <p>{s.detail}</p>
              {s.links.length > 0 && (
                <p className="links">{s.links.map((l) => (<a key={l.url} href={l.url} target="_blank" rel="noopener noreferrer">{l.label}</a>))}</p>
              )}
            </div>
          </li>
        ))}
      </ol>
    </Section>
  );
}
