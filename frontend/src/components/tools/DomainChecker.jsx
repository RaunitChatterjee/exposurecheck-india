import { Fragment, useState } from "react";
import ToolShell from "./ToolShell.jsx";
import Section from "../Section.jsx";
import ReportWrongResult from "./ReportWrongResult.jsx";
import ShareVerdict from "./ShareVerdict.jsx";
import { analyzeDomain, LIST_SUMMARY } from "../../lib/domains.js";
import { CHECKED_ON } from "../../lib/orgs.js";

const SEV = { bad: "Problem", warn: "Check", ok: "Good", info: "Note" };
const EXAMPLES = ["hdfc-kyc-update.xyz", "https://www.hdfc.bank.in", "paytrn.com", "support.sbi@gmail.com"];

export default function DomainChecker() {
  const [text, setText] = useState("");
  const [result, setResult] = useState(null);
  const [showList, setShowList] = useState(false);

  function run(value) { setResult(analyzeDomain(value)); }

  return (
    <ToolShell
      title="Is this the real website?"
      intro="Paste a link, a website name or an email address. We compare it with the official addresses of banks, government bodies, couriers and apps that scammers copy most, and look for look-alike spelling and other tricks."
      privacy="Everything runs in your browser. The address is not sent anywhere, and we never open the link. Our list covers a limited set of organisations: an address that is not on it is 'not recognised', which is not the same as safe.">
      <div className="notice notice-warn golden"><b>Banks have a new address ending.</b> The RBI told banks to move to addresses ending in <b>.bank.in</b> (deadline 31 Oct 2025), and most old bank addresses now redirect there. A bank website that does not end in .bank.in is a reason to stop and check.</div>

      <form className="panel scan" onSubmit={(e) => { e.preventDefault(); run(text); }}>
        <label htmlFor="dom">Link, website or email address</label>
        <input id="dom" type="text" className="mono" maxLength={500} spellCheck="false" autoComplete="off" value={text}
               placeholder="e.g. hdfc-kyc-update.xyz or support@bank-help.in"
               onChange={(e) => { setText(e.target.value); setResult(null); }} />
        <div className="row row-end">
          <button className="btn" type="submit" disabled={!text.trim()}>Check address</button>
          {EXAMPLES.map((x) => (
            <button key={x} type="button" className="textbtn" onClick={() => { setText(x); run(x); }}>{x.replace(/^https:\/\//, "")}</button>
          ))}
        </div>
      </form>

      {result && !result.ok && <div className="notice notice-warn" role="alert">{result.error}</div>}
      {result && result.ok && (
        <div className="result-wrap">
          <div className={`result result-${result.verdict.id}`} role="status">
            <h2>{result.verdict.label}</h2>
            <p>{result.headline}</p>
          </div>
          <ul className="signals">
            {result.findings.map((f, i) => (
              <li key={i}><span className={`sev sev-${f.severity}`}>{SEV[f.severity]}</span><h3>{f.title}</h3><p>{f.detail}</p></li>
            ))}
          </ul>
          <Section title="What we read">
            <dl className="kv">{result.facts.map(([k, v]) => (<Fragment key={k}><dt>{k}</dt><dd>{v}</dd></Fragment>))}</dl>
          </Section>
          <Section title="Safer way to reach them">
            <ul className="plain">
              <li>Open the organisation's own app, or type its address yourself. Do not use a link from a message or call.</li>
              <li>For a bank, call the number printed on the back of your card.</li>
              <li>If you already entered details on this site, call <b>1930</b> and use the “I've been scammed” tab.</li>
            </ul>
          </Section>
          <ShareVerdict kind="website" level={result.verdict.id} address={result.host}
            signs={result.findings.filter((f) => f.severity === "bad" || f.severity === "warn").map((f) => ({ label: f.title, weight: f.severity === "bad" ? 2 : 1 }))} />
          <ReportWrongResult tool="Is this the real website? (address check)" text={text} textLabel="address"
            summary={[`Verdict: ${result.verdict.label}`, ...result.findings.map((f) => `${SEV[f.severity]}: ${f.title}`)]} />
        </div>
      )}

      <p className="fine report-link">
        <button type="button" className="textbtn" onClick={() => setShowList((s) => !s)} aria-expanded={showList}>
          {showList ? "Hide" : "Show"} the {LIST_SUMMARY.length} organisations we know
        </button>
      </p>
      {showList && (
        <div className="panel">
          <p className="fine">Checked against each organisation's own website on {CHECKED_ON}. This is a short list, not a full directory. Spotted a mistake or a missing name? Use the report button above.</p>
          <table className="orgs">
            <thead><tr><th>Organisation</th><th>Type</th><th>Official address</th></tr></thead>
            <tbody>
              {LIST_SUMMARY.map((o) => (
                <tr key={o.name}><td>{o.name}</td><td>{o.type}</td><td className="mono">{o.official.join(", ")}{o.legacy.length ? ` (old: ${o.legacy.join(", ")})` : ""}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </ToolShell>
  );
}
