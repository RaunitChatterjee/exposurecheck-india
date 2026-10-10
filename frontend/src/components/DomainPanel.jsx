const LABEL = { pass: "Pass", warn: "Needs work", fail: "Missing / unsafe", unknown: "Inconclusive" };

function Check({ name, c }) {
  if (!c) return null;
  return (
    <li className="check">
      <span className={`dot dot-${c.status}`} aria-hidden="true" />
      <div>
        <b>{name}</b> <span className={`chip chip-${c.status}`}>{LABEL[c.status]}</span>
        <p className="small">{c.detail}</p>
        {c.record && <code>{c.record}</code>}
      </div>
    </li>
  );
}

export default function DomainPanel({ exposure, mail }) {
  return (
    <section className="card">
      <h2>Domain: {exposure.domain || mail.domain}</h2>
      <h3>Email protection</h3>
      {mail.status === "ok" ? (
        <ul className="checks"><Check name="SPF" c={mail.spf} /><Check name="DKIM" c={mail.dkim} /><Check name="DMARC" c={mail.dmarc} /></ul>
      ) : (<p className="alert alert-warn">{mail.message}</p>)}
      <h3>Publicly visible hostnames</h3>
      {exposure.status === "ok" ? (
        <>
          <p>{exposure.total} hostname{exposure.total === 1 ? "" : "s"} appear in public certificate logs.</p>
          {exposure.interesting.length > 0 && (
            <>
              <p className="small"><b>Worth reviewing</b> (names attackers tend to probe first):</p>
              <ul className="hosts">{exposure.interesting.map((h) => <li key={h}><code>{h}</code></li>)}</ul>
            </>
          )}
          {exposure.subdomains.length > 0 && (
            <details><summary>All hostnames{exposure.truncated ? " (first 100)" : ""}</summary>
              <ul className="hosts">{exposure.subdomains.map((h) => <li key={h}><code>{h}</code></li>)}</ul>
            </details>
          )}
        </>
      ) : (<p className="alert alert-warn">{exposure.message}</p>)}
    </section>
  );
}
