import Section from "./Section.jsx";

export default function BreachList({ breaches }) {
  return (
    <Section title="Websites and services where your email leaked" intro="Look for services you have used. Open one to see what was exposed and what an attacker could do with it.">
      <ul className="breaches">
        {breaches.map((b) => (
          <li key={b.name}>
            <details>
              <summary>
                <span className="b-title">{b.title}</span>
                {b.domain && b.domain.toLowerCase() !== b.title.toLowerCase() && <span className="b-domain">{b.domain}</span>}
                {b.is_india_related && <span className="chip chip-in">India-related</span>}
                {b.is_sensitive && <span className="chip chip-bad">Sensitive</span>}
                <span className="b-date">{b.breach_date || "Date unknown"}</span>
              </summary>
              <div className="b-body">
                <p><b>What an attacker can do.</b> {b.attacker_view}</p>
                <p className="chips"><b>Data exposed.</b> {b.data_classes.map((d) => (<span className="chip" key={d}>{d}</span>))}</p>
                {b.pwn_count != null && <p className="fine">{b.pwn_count.toLocaleString("en-IN")} accounts affected{b.domain ? ` at ${b.domain}` : ""}</p>}
                {b.description && <p className="fine">{b.description}</p>}
              </div>
            </details>
          </li>
        ))}
      </ul>
    </Section>
  );
}
