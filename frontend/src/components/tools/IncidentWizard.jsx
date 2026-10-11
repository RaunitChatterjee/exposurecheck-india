import { useState } from "react";
import ToolShell from "./ToolShell.jsx";
import Section from "../Section.jsx";
import { SITUATIONS, TIMING, METHODS, DONTS, buildPlan, buildComplaint, buildBankLetter, timingBanner, liabilityNote, evidenceList, lostMoney } from "../../lib/incident.js";

function CopyBox({ title, text, id }) {
  const [done, setDone] = useState(false);
  async function copy() {
    try { await navigator.clipboard.writeText(text); setDone(true); setTimeout(() => setDone(false), 2000); } catch { /* user can select manually */ }
  }
  return (
    <div className="copybox">
      <div className="row row-end copybox-head">
        <label htmlFor={id}>{title}</label>
        <button type="button" className="btn btn-quiet noprint" onClick={copy}>{done ? "Copied" : "Copy"}</button>
      </div>
      <textarea id={id} rows={12} readOnly value={text} className="mono" />
    </div>
  );
}

export default function IncidentWizard() {
  const [a, setA] = useState({ situation: "", timing: "", paid: false, method: "" });
  const [d, setD] = useState({});
  const [letter, setLetter] = useState("unauthorised");
  const [show, setShow] = useState(false);

  const sit = SITUATIONS.find((s) => s.id === a.situation);
  const ready = a.situation && a.timing && (!lostMoney(a) || a.method);
  const set = (k, v) => { setA((p) => ({ ...p, [k]: v })); setShow(false); };
  const det = { ...d, method: METHODS.find((m) => m.id === a.method)?.label || d.method };

  const plan = show ? buildPlan(a) : [];
  const banner = show ? timingBanner(a) : null;
  const liab = show ? liabilityNote(a) : null;

  return (
    <ToolShell
      title="I've been scammed. What do I do now?"
      intro="Answer three quick questions and get an ordered checklist: who to call first, what to say, what proof to keep, plus a ready-to-send complaint and bank letter. Built around India's 1930 helpline and the RBI customer-protection rules."
      privacy="Everything you type stays in your browser and is not sent or stored anywhere. Closing this tab clears it. This is guidance, not legal advice; official responses and outcomes are decided by your bank and the authorities.">
      <div className="notice notice-error sos"><b>Money just left your account?</b> Call <a href="tel:1930"><b>1930</b></a> now. You can fill this in afterwards.</div>

      <form className="panel wizard" onSubmit={(e) => { e.preventDefault(); setShow(true); }}>
        <fieldset>
          <legend>1. What happened?</legend>
          {SITUATIONS.map((s) => (
            <label key={s.id} className="choice"><input type="radio" name="sit" checked={a.situation === s.id} onChange={() => set("situation", s.id)} />{s.label}</label>
          ))}
        </fieldset>

        {a.situation && sit && !sit.money && (
          <fieldset>
            <legend>Did you also lose money?</legend>
            <label className="choice"><input type="radio" name="paid" checked={!a.paid} onChange={() => set("paid", false)} />No</label>
            <label className="choice"><input type="radio" name="paid" checked={a.paid} onChange={() => set("paid", true)} />Yes</label>
          </fieldset>
        )}

        <fieldset>
          <legend>2. How long ago?</legend>
          {TIMING.map((t) => (
            <label key={t.id} className="choice"><input type="radio" name="time" checked={a.timing === t.id} onChange={() => set("timing", t.id)} />{t.label}</label>
          ))}
        </fieldset>

        {lostMoney(a) && (
          <fieldset>
            <legend>3. How was the money taken or sent?</legend>
            {METHODS.map((m) => (
              <label key={m.id} className="choice"><input type="radio" name="method" checked={a.method === m.id} onChange={() => set("method", m.id)} />{m.label}</label>
            ))}
          </fieldset>
        )}

        <div className="row row-end"><button className="btn" type="submit" disabled={!ready}>Show my action plan</button></div>
      </form>

      {show && (
        <div className="result-wrap plan">
          <div className={`result ${banner.level === "urgent" ? "result-bad" : banner.level === "warn" ? "result-caution" : "result-none"}`} role="status">
            <h2>{banner.level === "urgent" ? "Act now" : "Your action plan"}</h2>
            <p>{banner.text}</p>
          </div>

          <ol className="plan-steps">
            {plan.map((s) => (
              <li key={s.n} className={s.urgent ? "step-urgent" : ""}>
                <h3>{s.title}</h3>
                <p>{s.detail}</p>
                {s.call && <a className="btn btn-quiet noprint" href={`tel:${s.call}`}>Call {s.call}</a>}
                {s.link && <a href={s.link.href} target="_blank" rel="noopener noreferrer">{s.link.text}</a>}
              </li>
            ))}
          </ol>

          {liab && (
            <Section title={liab.title}>
              <ul className="plain">{liab.points.map((p, i) => <li key={i}>{p}</li>)}</ul>
            </Section>
          )}

          <Section title="Keep this evidence">
            <ul className="plain">{evidenceList(a).map((e, i) => <li key={i}>{e}</li>)}</ul>
          </Section>

          <Section title="Please don't">
            <ul className="plain">{DONTS.map((e, i) => <li key={i}>{e}</li>)}</ul>
          </Section>

          {lostMoney(a) && (
            <Section title="Ready-to-use complaint text">
              <p className="fine">Fill in what you know. Everything stays in your browser. Edit the text freely after copying.</p>
              <div className="grid2 noprint">
                {[["when", "Date and time"], ["amount", "Amount (₹)"], ["txn", "Transaction ID / UTR"], ["payee", "Scammer's UPI ID / account / phone"], ["bank", "Your bank"], ["account", "Your account no."], ["ack1930", "1930 acknowledgement no."], ["bankRef", "Bank complaint ref no."], ["name", "Your name"], ["phone", "Registered mobile"]].map(([k, label]) => (
                  <label key={k} className="field">{label}<input type="text" autoComplete="off" maxLength={200} value={d[k] || ""} onChange={(e) => setD((p) => ({ ...p, [k]: e.target.value }))} /></label>
                ))}
              </div>
              <label className="field noprint">Story, in your words
                <textarea rows={4} maxLength={2000} value={d.story || ""} onChange={(e) => setD((p) => ({ ...p, story: e.target.value }))} />
              </label>
              <CopyBox id="cmp" title="For cybercrime.gov.in" text={buildComplaint(a, det)} />
              <fieldset className="noprint">
                <legend>Bank letter type</legend>
                <label className="choice"><input type="radio" name="lt" checked={letter === "unauthorised"} onChange={() => setLetter("unauthorised")} />I did not authorise it (hacked, remote access, card misuse)</label>
                <label className="choice"><input type="radio" name="lt" checked={letter === "deceived"} onChange={() => setLetter("deceived")} />I paid, but was deceived</label>
              </fieldset>
              <CopyBox id="bank" title="Letter to your bank" text={buildBankLetter(a, { ...det, today: new Date().toLocaleDateString("en-IN") }, letter)} />
            </Section>
          )}

          <div className="row noprint"><button type="button" className="btn btn-quiet" onClick={() => window.print()}>Print or save as PDF</button></div>
        </div>
      )}
    </ToolShell>
  );
}
