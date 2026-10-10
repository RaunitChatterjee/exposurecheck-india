export default function Remediation({ steps }) {
  return (
    <section className="card">
      <h2>What to do next</h2>
      <ol className="steps">
        {steps.map((s) => (
          <li key={s.title}>
            <span className={`pri pri-${s.priority}`}>{s.priority === 1 ? "Do now" : s.priority === 2 ? "Soon" : s.priority === 3 ? "This week" : "Good to know"}</span>
            <h3>{s.title}</h3>
            <p>{s.detail}</p>
            {s.links.length > 0 && (
              <p className="links">{s.links.map((l) => (<a key={l.url} href={l.url} target="_blank" rel="noopener noreferrer">{l.label} ↗</a>))}</p>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}
