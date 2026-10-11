import Section from "./Section.jsx";

export default function MitrePanel({ techniques }) {
  if (!techniques.length) return null;
  return (
    <Section title="How attackers could use this" intro="Mapped to MITRE ATT&CK. Select a technique ID for the full reference.">
      <ul className="mitre">
        {techniques.map((t) => (
          <li key={t.id}>
            <a href={t.url} target="_blank" rel="noopener noreferrer" className="tid">{t.id}</a>
            <div><h4>{t.name}</h4><p>{t.why}</p></div>
          </li>
        ))}
      </ul>
    </Section>
  );
}
