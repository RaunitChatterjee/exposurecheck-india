import { useState } from "react";
import ToolShell from "./ToolShell.jsx";
import { CARD, CARD_LANGS, shareText, suggestCodeWord } from "../../lib/familycard.js";

export default function FamilyCard() {
  const [lang, setLang] = useState("en");
  const [name, setName] = useState("");
  const [codeWord, setCodeWord] = useState("");
  const [bank, setBank] = useState("");
  const [family, setFamily] = useState("");
  const [copied, setCopied] = useState(false);
  const c = CARD[lang];

  async function copy() {
    try { await navigator.clipboard.writeText(shareText(lang, { name, codeWord })); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* select manually */ }
  }

  return (
    <ToolShell
      title="Family safety card"
      intro="Make a one-page card for a parent or grandparent: five simple rules, the cyber crime helpline, and a family code word. Print it or save it as a PDF, or copy it into the family WhatsApp group."
      privacy="The card is made in your browser. The name, code word and numbers you type are not sent anywhere or saved, and are gone when you close this page. Hindi and Hinglish text was written by the maintainer; tell us if a word reads wrongly.">
      <div className="panel noprint">
        <div className="row langs" role="group" aria-label="Card language">
          {CARD_LANGS.map((l) => (
            <button key={l.id} type="button" className={`textbtn lang ${lang === l.id ? "lang-on" : ""}`} aria-pressed={lang === l.id} onClick={() => setLang(l.id)}>{l.label}</button>
          ))}
        </div>
        <div className="grid2">
          <label className="field">Card for (optional)<input type="text" maxLength={40} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Papa" /></label>
          <label className="field">Family code word (optional)
            <span className="row" style={{ gap: 8 }}>
              <input type="text" maxLength={40} value={codeWord} onChange={(e) => setCodeWord(e.target.value)} placeholder="Pick one together" />
              <button type="button" className="textbtn" onClick={() => setCodeWord(suggestCodeWord())}>Suggest</button>
            </span>
          </label>
          <label className="field">Bank helpline, from the back of the card (optional)<input type="text" maxLength={40} value={bank} onChange={(e) => setBank(e.target.value)} /></label>
          <label className="field">Family member to call first (optional)<input type="text" maxLength={60} value={family} onChange={(e) => setFamily(e.target.value)} placeholder="Name and number" /></label>
        </div>
        <p className="fine">Tip: agree the code word out loud, not over text. Do not use a birthday, pet name or anything on social media.</p>
        <div className="row row-end">
          <button type="button" className="btn" onClick={() => window.print()}>Print or save as PDF</button>
          <button type="button" className="btn btn-quiet" onClick={copy}>{copied ? "Copied" : "Copy for WhatsApp"}</button>
        </div>
      </div>

      <article className="fcard" lang={lang === "hi" ? "hi" : "en"} aria-label="Family safety card">
        <header>
          <h2>{c.title}{name.trim() && <span className="fcard-name"> · {name.trim()}</span>}</h2>
          <p>{c.sub}</p>
        </header>
        <ol className="fcard-rules">
          {c.rules.map(([h, d], i) => (<li key={i}><b>{h}</b><span>{d}</span></li>))}
        </ol>
        <p className="fcard-first">{c.first}</p>
        <div className="fcard-code">
          <b>{c.codeTitle}</b>
          <span className="fcard-blank">{codeWord.trim() || " "}</span>
          <small>{c.codeHelp}</small>
        </div>
        <div className="fcard-contacts">
          <b>{c.contactsTitle}</b>
          <dl>
            <dt>{c.labels.helpline}</dt><dd className="big">1930</dd>
            <dt>{c.labels.website}</dt><dd>cybercrime.gov.in</dd>
            <dt>{c.labels.bank}</dt><dd className="fcard-blank">{bank.trim() || " "}</dd>
            <dt>{c.labels.family}</dt><dd className="fcard-blank">{family.trim() || " "}</dd>
          </dl>
        </div>
        <footer>exposurecheck-india.vercel.app</footer>
      </article>
    </ToolShell>
  );
}
