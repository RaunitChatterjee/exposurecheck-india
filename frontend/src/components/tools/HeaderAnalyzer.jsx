import { useState } from "react";
import ToolShell from "./ToolShell.jsx";
import Section from "../Section.jsx";
import { analyzeHeaders } from "../../lib/headers.js";

const SEV = { bad: "Problem", warn: "Check", ok: "Good", info: "Note" };

export default function HeaderAnalyzer() {
  const [raw, setRaw] = useState("");
  const [r, setR] = useState(null);

  return (
    <ToolShell
      title="Where did this email really come from?"
      intro="Paste the full raw headers of a suspicious email. We read the SPF, DKIM and DMARC results, compare the sender fields, and trace the path the message took."
      privacy="Analysis happens in your browser. The headers are not sent to any server. In Gmail, open the message, choose the three-dot menu, then Show original. In Outlook, open the message properties and copy the Internet headers.">
      <form className="panel scan" onSubmit={(e) => { e.preventDefault(); setR(analyzeHeaders(raw)); }}>
        <label htmlFor="hdr">Email headers</label>
        <textarea id="hdr" rows={9} maxLength={60000} spellCheck="false" className="mono" value={raw}
                  placeholder={"Received: from ...\nAuthentication-Results: ...\nFrom: ..."}
                  onChange={(e) => { setRaw(e.target.value); setR(null); }} />
        <div className="row row-end"><button className="btn" type="submit" disabled={!raw.trim()}>Analyze headers</button></div>
      </form>

      {r && !r.ok && <div className="notice notice-warn" role="alert">{r.error}</div>}
      {r && r.ok && (
        <div className="result-wrap">
          <div className={`result result-${r.verdict.id}`} role="status"><h2>{r.verdict.label}</h2></div>
          <ul className="signals">
            {r.findings.map((f, i) => (
              <li key={i}><span className={`sev sev-${f.severity}`}>{SEV[f.severity]}</span><h3>{f.title}</h3><p>{f.detail}</p></li>
            ))}
          </ul>
          <Section title="Sender and authentication">
            <dl className="kv">
              <dt>From</dt><dd>{r.summary.from || "Not found"}</dd>
              <dt>Return-Path</dt><dd>{r.summary.returnPath || "Not found"}</dd>
              {r.summary.replyTo && (<><dt>Reply-To</dt><dd>{r.summary.replyTo}</dd></>)}
              {r.summary.subject && (<><dt>Subject</dt><dd>{r.summary.subject}</dd></>)}
              <dt>SPF</dt><dd>{r.auth.spf || "Not reported"}</dd>
              <dt>DKIM</dt><dd>{r.auth.dkim || "Not reported"}{r.auth.dkimDomain ? ` (${r.auth.dkimDomain})` : ""}</dd>
              <dt>DMARC</dt><dd>{r.auth.dmarc || "Not reported"}</dd>
              {r.originIp && (<><dt>First public IP</dt><dd>{r.originIp}</dd></>)}
            </dl>
          </Section>
          {r.hops.length > 0 && (
            <Section title="Route taken" intro="Earliest server first. Only the hops added by your own mail provider are fully trustworthy.">
              <ol className="hops">
                {r.hops.map((h, i) => (
                  <li key={i}>
                    <b>{h.from || "unknown"}</b> to <b>{h.by || "unknown"}</b>
                    <span className="fine">{h.ips.length ? ` · ${h.ips.join(", ")}` : ""}{h.time ? ` · ${h.time.toLocaleString("en-IN")}` : ""}</span>
                  </li>
                ))}
              </ol>
            </Section>
          )}
        </div>
      )}
    </ToolShell>
  );
}
