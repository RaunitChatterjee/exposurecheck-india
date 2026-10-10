export default function BreachList({ breaches }) {
  return (
    <section className="card">
      <h2>Breaches that include your email</h2>
      <ul className="breaches">
        {breaches.map((b) => (
          <li key={b.name}>
            <details>
              <summary>
                <span className="b-title">{b.title}</span>
                {b.is_india_related && <span className="chip chip-in">India-related</span>}
                {b.is_sensitive && <span className="chip chip-warn">Sensitive</span>}
                <span className="muted b-date">{b.breach_date || "date unknown"}</span>
              </summary>
              <div className="b-body">
                <p><b>What an attacker can do:</b> {b.attacker_view}</p>
                <p><b>Data exposed:</b> {b.data_classes.map((d) => (<span className="chip" key={d}>{d}</span>))}</p>
                {b.pwn_count != null && <p className="muted small">{b.pwn_count.toLocaleString("en-IN")} accounts affected{b.domain ? ` · ${b.domain}` : ""}</p>}
                {b.description && <p className="muted small">{b.description}</p>}
              </div>
            </details>
          </li>
        ))}
      </ul>
    </section>
  );
}
