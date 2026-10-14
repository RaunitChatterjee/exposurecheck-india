import { useState } from "react";
import { REPO_URL } from "../../config.js";
import { REPORT_KINDS, buildIssueUrl, buildReportText } from "../../lib/report.js";

// "This result looks wrong" helper. Nothing is sent from the app: the person opens a pre-filled GitHub issue
// themselves, or copies the text. The message is only included if they tick the box.
export default function ReportWrongResult({ tool, summary, text, textLabel = "message" }) {
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState(REPORT_KINDS[0].id);
  const [note, setNote] = useState("");
  const [includeText, setIncludeText] = useState(false);
  const [copied, setCopied] = useState(false);

  const args = { tool, kind, summary, note, includeText, text };

  async function copy() {
    try { await navigator.clipboard.writeText(buildReportText(args)); setCopied(true); setTimeout(() => setCopied(false), 2000); }
    catch { setCopied(false); }
  }

  if (!open) {
    return <p className="fine report-link"><button type="button" className="textbtn" onClick={() => setOpen(true)}>This result looks wrong? Report it</button></p>;
  }
  return (
    <section className="panel report" aria-label="Report a wrong result">
      <h3>Report a wrong result</h3>
      <p className="fine">Nothing is sent from this page. You choose whether to open a pre-filled GitHub issue (public, needs a free GitHub account) or just copy the text.</p>
      <fieldset>
        <legend className="fine">What went wrong?</legend>
        {REPORT_KINDS.map((k) => (
          <label key={k.id} className="check">
            <input type="radio" name="report-kind" checked={kind === k.id} onChange={() => setKind(k.id)} /> {k.label}
          </label>
        ))}
      </fieldset>
      <label htmlFor="report-note">What should it have said? (optional)</label>
      <textarea id="report-note" rows={3} maxLength={800} value={note} onChange={(e) => setNote(e.target.value)} />
      {text && (
        <label className="check">
          <input type="checkbox" checked={includeText} onChange={(e) => setIncludeText(e.target.checked)} />
          {" "}Include the {textLabel} text. It becomes <b>public on GitHub</b>, so remove names, numbers and links first.
        </label>
      )}
      <div className="row row-end">
        <a className="btn" href={buildIssueUrl(REPO_URL, args)} target="_blank" rel="noopener noreferrer">Open GitHub issue</a>
        <button type="button" className="btn btn-quiet" onClick={copy}>{copied ? "Copied" : "Copy report"}</button>
        <button type="button" className="textbtn" onClick={() => setOpen(false)}>Close</button>
      </div>
    </section>
  );
}
