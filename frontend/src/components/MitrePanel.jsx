export default function MitrePanel({ techniques }) {
  if (!techniques.length) return null;
  return (
    <section className="card">
      <h2>How attackers could use this: MITRE ATT&amp;CK</h2>
      <p className="muted small">Techniques that your findings make easier. Click an ID for the full reference.</p>
      <ul className="mitre">
        {techniques.map((t) => (
          <li key={t.id}>
            <a href={t.url} target="_blank" rel="noopener noreferrer" className="chip chip-id">{t.id}</a>
            <div><b>{t.name}</b><p className="small">{t.why}</p></div>
          </li>
        ))}
      </ul>
    </section>
  );
}
