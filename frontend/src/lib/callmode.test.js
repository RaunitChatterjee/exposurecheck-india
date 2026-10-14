import test from "node:test";
import assert from "node:assert/strict";
import { SCENARIOS, TELLS, DONE, getScenario, tellsVerdict, urgentSteps, familyMessage } from "./callmode.js";

test("every scenario has the full set of content in three languages", () => {
  const ids = new Set();
  for (const s of SCENARIOS) {
    assert.ok(!ids.has(s.id)); ids.add(s.id);
    assert.ok(s.label && s.truth, s.id);
    for (const l of ["en", "hinglish", "hi"]) assert.ok(s.say[l]?.length > 10, `${s.id} ${l}`);
    assert.ok(s.steps.length >= 3 && s.never.length >= 2, s.id);
  }
  assert.match(getScenario("arrest").say.hi, /[ऀ-ॿ]/);
});

test("tells verdict", () => {
  assert.equal(tellsVerdict([]).level, "none");
  assert.equal(tellsVerdict(["id"]).level, "warn");
  assert.equal(tellsVerdict(["secret"]).level, "hangup");
  assert.match(tellsVerdict(["stay", "otp"]).headline, /2 scam signs/);
  assert.equal(tellsVerdict(["stay"]).tells.length, 1);
  assert.ok(TELLS.every((t) => t.why));
});

test("urgent steps are ordered and complete", () => {
  assert.deepEqual(urgentSteps([]), []);
  const s = urgentSteps(["paid", "oncall", "app"]);
  assert.equal(s[0].title, "Hang up now");
  assert.equal(s[1].tel, "1930");
  assert.ok(s.some((x) => /Cut off the app/.test(x.title)));
  assert.equal(s.at(-1).goto, "sos");
  assert.ok(urgentSteps(["idcard"]).some((x) => /Aadhaar/.test(x.detail)));
  assert.ok(urgentSteps(DONE.map((d) => d.id)).length >= 5);
});

test("family message includes the claim and no sensitive data", () => {
  const m = familyMessage("blackmail");
  assert.match(m, /threaten/);
  assert.match(familyMessage("nope"), /scammer/);
});
