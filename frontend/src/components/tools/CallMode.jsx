import { useState } from "react";
import ToolShell from "./ToolShell.jsx";
import Section from "../Section.jsx";
import { SCENARIOS, TELLS, DONE, getScenario, tellsVerdict, urgentSteps, familyMessage } from "../../lib/callmode.js";

const LANGS = [["en", "English"], ["hinglish", "Hinglish"], ["hi", "हिन्दी"]];

function toggle(list, id) { return list.includes(id) ? list.filter((x) => x !== id) : [...list, id]; }

export default function CallMode({ onOpen }) {
  const [scenario, setScenario] = useState("");
  const [tells, setTells] = useState([]);
  const [done, setDone] = useState([]);
  const [lang, setLang] = useState("en");
  const [big, setBig] = useState(false);
  const [copied, setCopied] = useState("");

  const sc = getScenario(scenario);
  const verdict = tellsVerdict(tells);
  const urgent = urgentSteps(done);

  async function copy(key, text) {
    try { await navigator.clipboard.writeText(text); setCopied(key); setTimeout(() => setCopied(""), 2000); } catch { /* user can select manually */ }
  }

  if (big) {
    return (
      <div className="bigcard" role="dialog" aria-label="Read this aloud">
        <h1>Hang up now.</h1>
        <ul>
          <li>No police, court, CBI, bank or courier arrests or investigates anyone over a phone or video call.</li>
          <li>No one needs your OTP, PIN or CVV, or a "safe account" transfer.</li>
          <li>Do not install any app they ask for.</li>
          <li>Call a family member. Then call <a href="tel:1930">1930</a> if money or details went.</li>
        </ul>
        <button type="button" className="btn" onClick={() => setBig(false)}>Close</button>
      </div>
    );
  }

  return (
    <ToolShell
      title="I'm on a call right now"
      intro="Someone is on the phone or a video call pressuring you? Hang up first. Then use this page: spot the signs, get the exact words to say, and see what to do if you have already acted."
      privacy="Nothing you tick here is sent or stored. This is guidance, not legal advice. When in doubt, hang up and contact the organisation yourself on a number you look up.">
      <div className="notice notice-error sos callnow">
        <b>Hang up first.</b> A genuine caller can always wait while you check. You can call back on an official number once you are calm.
        <div className="row row-end"><button type="button" className="btn btn-quiet" onClick={() => setBig(true)}>Show big text for someone next to me</button></div>
      </div>

      <section className="panel wizard">
        <fieldset>
          <legend>1. Is any of this happening on the call?</legend>
          {TELLS.map((t) => (
            <label key={t.id} className="choice"><input type="checkbox" checked={tells.includes(t.id)} onChange={() => setTells(toggle(tells, t.id))} />{t.label}</label>
          ))}
        </fieldset>
        <div className={`verdict verdict-${verdict.level}`} role="status">
          <b>{verdict.headline}</b>
          {verdict.tells.length > 0 && (
            <ul className="plain">{verdict.tells.map((t) => <li key={t.id}>{t.why}</li>)}</ul>
          )}
        </div>
      </section>

      <section className="panel wizard">
        <fieldset>
          <legend>2. What are they claiming?</legend>
          {SCENARIOS.map((s) => (
            <label key={s.id} className="choice"><input type="radio" name="scenario" checked={scenario === s.id} onChange={() => setScenario(s.id)} />{s.label}</label>
          ))}
        </fieldset>
      </section>

      {sc && (
        <div className="result-wrap">
          <Section title="What is really going on">
            <p>{sc.truth}</p>
          </Section>
          <Section title="Say this, then hang up">
            <div className="row langs" role="group" aria-label="Language">
              {LANGS.map(([id, label]) => (
                <button key={id} type="button" className={`textbtn lang ${lang === id ? "lang-on" : ""}`} aria-pressed={lang === id} onClick={() => setLang(id)}>{label}</button>
              ))}
            </div>
            <blockquote className="say" lang={lang === "hi" ? "hi" : "en"}>{sc.say[lang]}</blockquote>
            <p className="fine">You do not have to be polite or explain. Hanging up without a word is fine too.</p>
          </Section>
          <Section title="Do this">
            <ol className="plain">{sc.steps.map((x, i) => <li key={i}>{x}</li>)}</ol>
          </Section>
          <Section title="Do not">
            <ul className="plain">{sc.never.map((x, i) => <li key={i}>{x}</li>)}</ul>
          </Section>
          <Section title="Tell someone nearby">
            <p className="fine">Scammers rely on you being alone. Copy this and send it to a family member or friend.</p>
            <textarea readOnly rows={4} className="mono" value={familyMessage(scenario)} aria-label="Message for a family member" />
            <div className="row row-end"><button type="button" className="btn btn-quiet" onClick={() => copy("msg", familyMessage(scenario))}>{copied === "msg" ? "Copied" : "Copy message"}</button></div>
          </Section>
        </div>
      )}

      <section className="panel wizard">
        <fieldset>
          <legend>3. Have you already done any of these?</legend>
          {DONE.map((d) => (
            <label key={d.id} className="choice"><input type="checkbox" checked={done.includes(d.id)} onChange={() => setDone(toggle(done, d.id))} />{d.label}</label>
          ))}
        </fieldset>
        {urgent.length > 0 && (
          <ol className="urgent" aria-label="What to do now">
            {urgent.map((u, i) => (
              <li key={i}>
                <h3>{u.title}</h3>
                <p>{u.detail}</p>
                {u.tel && <a className="btn" href={`tel:${u.tel}`}>Call {u.tel}</a>}
                {u.goto && <button type="button" className="btn btn-quiet" onClick={() => onOpen(u.goto)}>Open the “I've been scammed” plan</button>}
              </li>
            ))}
          </ol>
        )}
      </section>
    </ToolShell>
  );
}
