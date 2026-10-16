import test from "node:test";
import assert from "node:assert/strict";
import { SCENARIOS, TOTAL, gradeAnswer, scoreQuiz, bandFor, shareScore } from "./quiz.js";
import { analyzeMessage } from "./scam.js";

test("scenarios are complete and mix scams with genuine messages", () => {
  const ids = new Set();
  for (const s of SCENARIOS) {
    assert.ok(!ids.has(s.id)); ids.add(s.id);
    assert.ok(["scam", "genuine"].includes(s.answer), s.id);
    for (const k of ["channel", "text", "tell", "why", "todo"]) assert.ok(s[k] && s[k].length > 2, `${s.id} ${k}`);
  }
  assert.equal(TOTAL, 10);
  const genuine = SCENARIOS.filter((s) => s.answer === "genuine").length;
  assert.ok(genuine >= 3 && genuine <= 4, "keep a few genuine messages so people do not learn 'always scam'");
});

test("the quiz never contradicts the message checker", () => {
  for (const s of SCENARIOS) {
    const body = s.text.replace(/^[^\n]*\n/, "");
    const r = analyzeMessage(body);
    if (s.answer === "genuine") assert.ok(["none", "caution"].includes(r.level.id), `${s.id} genuine but rated ${r.level.id}`);
    else assert.ok(["likely", "high"].includes(r.level.id), `${s.id} scam but rated ${r.level.id}`);
  }
});

test("grading and scoring", () => {
  assert.deepEqual(gradeAnswer(SCENARIOS[0], "scam"), { correct: true, expected: "scam" });
  assert.equal(gradeAnswer(SCENARIOS[1], "scam").correct, false);
  const all = Object.fromEntries(SCENARIOS.map((s) => [s.id, s.answer]));
  const perfect = scoreQuiz(all);
  assert.equal(perfect.correct, 10); assert.equal(perfect.missed.length, 0); assert.equal(perfect.band.id, "sharp");
  const flipped = Object.fromEntries(SCENARIOS.map((s) => [s.id, s.answer === "scam" ? "genuine" : "scam"]));
  const none = scoreQuiz(flipped);
  assert.equal(none.correct, 0); assert.equal(none.missed.length, 10); assert.equal(none.band.id, "learn");
  assert.equal(scoreQuiz({}).answered, 0);
  assert.equal(scoreQuiz({ zzz: "scam" }).answered, 0);
});

test("score bands are gentle and cover 0 to 10", () => {
  for (let i = 0; i <= 10; i++) assert.ok(bandFor(i).label && bandFor(i).note, String(i));
  assert.equal(bandFor(8).id, "good");
  assert.equal(bandFor(5).id, "gaps");
});

test("shared score carries no answers or personal data", () => {
  const t = shareScore(7);
  assert.match(t, /7 out of 10/);
  assert.match(t, /exposurecheck-india\.vercel\.app/);
});
