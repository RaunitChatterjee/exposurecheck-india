import { useState } from "react";
import ToolShell from "./ToolShell.jsx";
import { SCENARIOS, TOTAL, gradeAnswer, scoreQuiz, shareScore } from "../../lib/quiz.js";
import { whatsappUrl } from "../../lib/verdictshare.js";

export default function Quiz({ onOpen }) {
  const [started, setStarted] = useState(false);
  const [i, setI] = useState(0);
  const [answers, setAnswers] = useState({});
  const [copied, setCopied] = useState(false);

  const s = SCENARIOS[i];
  const chosen = s ? answers[s.id] : null;
  const done = started && i >= TOTAL;
  const result = scoreQuiz(answers);

  function answer(choice) {
    if (chosen) return;
    setAnswers((a) => ({ ...a, [s.id]: choice }));
  }
  function restart() { setStarted(true); setI(0); setAnswers({}); setCopied(false); }
  async function copy() {
    try { await navigator.clipboard.writeText(shareScore(result.correct)); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* select manually */ }
  }

  return (
    <ToolShell
      title="Would you fall for this?"
      intro="Ten real-looking messages and calls, written for this quiz: some are scams, some are genuine. Decide, then see the giveaway. It takes about three minutes."
      privacy="Your answers stay on this page. Nothing is sent or saved, and the score is gone when you close it. All messages are invented for teaching.">
      {!started && (
        <div className="panel quiz-start">
          <p>Scammers rely on busy, careful people too. A few of these are genuine on purpose, because treating everything as a scam is its own problem.</p>
          <div className="row row-end"><button type="button" className="btn" onClick={() => setStarted(true)}>Start the quiz</button></div>
        </div>
      )}

      {started && !done && (
        <div className="panel quiz">
          <p className="fine quiz-count" aria-live="polite">Question {i + 1} of {TOTAL} · {s.channel}</p>
          <blockquote className="quiz-msg">{s.text}</blockquote>
          <div className="row quiz-choices" role="group" aria-label="Your answer">
            <button type="button" className={`btn ${chosen === "scam" ? "" : "btn-quiet"}`} disabled={Boolean(chosen)} onClick={() => answer("scam")}>Scam</button>
            <button type="button" className={`btn ${chosen === "genuine" ? "" : "btn-quiet"}`} disabled={Boolean(chosen)} onClick={() => answer("genuine")}>Genuine</button>
          </div>
          {chosen && (() => {
            const g = gradeAnswer(s, chosen);
            return (
              <div className={`quiz-reveal ${g.correct ? "quiz-ok" : "quiz-bad"}`} role="status">
                <h3>{g.correct ? "Correct" : "Not quite"}: this is {s.answer === "scam" ? "a scam" : "genuine"}.</h3>
                <p><b>The giveaway:</b> {s.tell}.</p>
                <p>{s.why}</p>
                <p><b>What to do:</b> {s.todo}</p>
                <div className="row row-end"><button type="button" className="btn" onClick={() => setI(i + 1)}>{i + 1 < TOTAL ? "Next question" : "See my score"}</button></div>
              </div>
            );
          })()}
        </div>
      )}

      {done && (
        <div className="panel quiz-result">
          <h2>{result.correct} out of {TOTAL}: {result.band.label}</h2>
          <p>{result.band.note}</p>
          {result.missed.length > 0 && (
            <>
              <h3>Worth remembering</h3>
              <ul className="plain">{result.missed.map((m) => (<li key={m.id}><b>{m.channel}:</b> {m.tell}.</li>))}</ul>
            </>
          )}
          <div className="row row-end">
            <a className="btn" href={whatsappUrl(shareScore(result.correct))} target="_blank" rel="noopener noreferrer">Share my score on WhatsApp</a>
            <button type="button" className="btn btn-quiet" onClick={copy}>{copied ? "Copied" : "Copy my score"}</button>
            <button type="button" className="btn btn-quiet" onClick={restart}>Play again</button>
          </div>
          {onOpen && <p className="fine">Next: <button type="button" className="textbtn textbtn-inline" onClick={() => onOpen("family")}>make a family safety card</button> or <button type="button" className="textbtn textbtn-inline" onClick={() => onOpen("message")}>check a message you received</button>.</p>}
        </div>
      )}
    </ToolShell>
  );
}
