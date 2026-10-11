import Section from "./Section.jsx";

const LABEL = { pass: "Pass", warn: "Needs work", fail: "Missing or unsafe", unknown: "Inconclusive" };

function Check({ name, c }) {
  if (!c) return null;
  return (
    <li className="check">
      <span className={`state state-${c.status}`}>{LABEL[c.status]}</span>
      <div>
        <h4>{name}</h4>
        <p>{c.detail}</p>
        {c.record && <code>{c.record}</code>}
      </div>
    </li>
  );
}

export default function DomainPanel({ exposure, mail }) {
  const domain = exposure.domain || mail.domain;
  return (
    <Section title={`Your domain, ${domain}`}>
      <h3 className="sub">Email protection</h3>
      {mail.status === "ok" ? (
        <ul className="checks"><Check name="SPF" c={mail.spf} /><Check name="DKIM" c={mail.dkim} /><Check name="DMARC" c={mail.dmarc} /></ul>
      ) : (<p className="notice notice-warn">{mail.message}</p>)}
      <h3 className="sub">Hostnames visible to the public</h3>
      {exposure.status === "ok" ? (
        <>
          <p>{exposure.total} {exposure.total === 1 ? "hostname appears" : "hostnames appear"} in public certificate logs.</p>
          {exposure.interesting.length > 0 && (
            <>
              <p><b>Worth reviewing.</b> Attackers tend to probe names like these first.</p>
              <ul className="hosts">{exposure.interesting.map((h) => <li key={h}><code>{h}</code></li>)}</ul>
            </>
          )}
          {exposure.subdomains.length > 0 && (
            <details className="more"><summary>All hostnames{exposure.truncated ? " (first 100)" : ""}</summary>
              <ul className="hosts">{exposure.subdomains.map((h) => <li key={h}><code>{h}</code></li>)}</ul>
            </details>
          )}
        </>
      ) : (<p className="notice notice-warn">{exposure.message}</p>)}
    </Section>
  );
}
