import { useState } from "react";
import ToolShell from "./ToolShell.jsx";
import Section from "../Section.jsx";
import { analyzeMessage, markMessage } from "../../lib/scam.js";
import ReportWrongResult from "./ReportWrongResult.jsx";

const EXAMPLE = "Dear SBI customer, your account will be blocked today. Update your KYC immediately: http://sbi-kyc-update.xyz/login";

export default function ScamChecker() {
  const [text, setText] = useState("");
  const [result, setResult] = useState(null);

  function run(e) {
    e.preventDefault();
    setResult({ ...analyzeMessage(text), text });
  }

  return (
    <ToolShell
      title="Is this message a scam?"
      intro="Paste an SMS, WhatsApp message or email. We look for the patterns behind common Indian frauds: KYC threats, fake courier and electricity notices, UPI collect requests, 'digital arrest' calls and look-alike bank links."
      privacy="Analysis happens in your browser. The message is not sent to any server. This tool finds warning signs; it cannot prove a message is safe, so when in doubt, contact the sender through an official number or app.">
      <form className="panel scan" onSubmit={run}>
        <label htmlFor="msg">Message text</label>
        <textarea id="msg" rows={6} maxLength={5000} value={text} placeholder="Paste the message here"
                  onChange={(e) => { setText(e.target.value); setResult(null); }} />
        <div className="row row-end">
          <button className="btn" type="submit" disabled={!text.trim()}>Check message</button>
          <button type="button" className="textbtn" onClick={() => { setText(EXAMPLE); setResult(null); }}>Try an example</button>
        </div>
      </form>

      {result && (
        <div className="result-wrap">
          <div className={`result result-${result.level.id}`} role="status">
            <h2>{result.level.label}</h2>
            <p>{result.signals.length === 0
              ? "We found no known scam patterns. That does not make it safe: if it asks for money, a link click or personal details, verify through an official channel first."
              : `${result.signals.length} warning ${result.signals.length === 1 ? "sign" : "signs"} found.`}</p>
            <p className="fine">Language detected: {result.language}</p>
          </div>
          {result.signals.length > 0 && (
            <>
              <div className="highlighted" aria-label="Your message with warning phrases marked">
                <p className="fine">The phrases that triggered warnings are marked.</p>
                <p className="hl-text">
                  {markMessage(result.text, result.signals).map((seg, i) => seg.marked
                    ? <mark key={i} className={seg.strong ? "hl-high" : "hl-med"} title={seg.labels.join(", ")}>{seg.text}</mark>
                    : <span key={i}>{seg.text}</span>)}
                </p>
              </div>
              <ul className="signals">
                {result.signals.map((s) => (
                  <li key={s.id}>
                    <h3>{s.label}</h3>
                    <p>{s.detail}</p>
                    {s.evidence && <code>{s.evidence}</code>}
                  </li>
                ))}
              </ul>
              <Section title="What to do">
                <ul className="plain">
                  <li>Do not click links, call back numbers in the message, or share any OTP, PIN or card detail.</li>
                  <li>If you already paid or shared details, call <b>1930</b> immediately and report at <a href="https://cybercrime.gov.in" target="_blank" rel="noopener noreferrer">cybercrime.gov.in</a>.</li>
                  <li>Report the message on <a href="https://sancharsaathi.gov.in" target="_blank" rel="noopener noreferrer">Sanchar Saathi</a> (Chakshu) so the number can be investigated.</li>
                </ul>
              </Section>
            </>
          )}
          <ReportWrongResult tool="Scam message checker" text={result.text}
            summary={[`Verdict: ${result.level.label} (score ${result.score})`, `Warning signs: ${result.signals.map((s) => s.label).join("; ") || "none"}`, `Language detected: ${result.language}`]} />
        </div>
      )}
    </ToolShell>
  );
}
