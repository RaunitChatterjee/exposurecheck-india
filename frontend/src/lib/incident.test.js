import test from "node:test";
import assert from "node:assert/strict";
import { buildPlan, buildComplaint, buildBankLetter, timingBanner, liabilityNote, lostMoney, evidenceList, SITUATIONS } from "./incident.js";

test("money lost in the golden hour puts 1930 first and marks it urgent", () => {
  const a = { situation: "upi", timing: "hour" };
  const plan = buildPlan(a);
  assert.match(plan[0].title, /1930/);
  assert.equal(plan[0].urgent, true);
  assert.equal(plan[0].n, 1);
  assert.equal(timingBanner(a).level, "urgent");
  assert.match(timingBanner(a).text, /golden hour/);
});

test("old incidents are not marked urgent but still report", () => {
  const plan = buildPlan({ situation: "upi", timing: "old" });
  assert.ok(!plan[0].urgent);
  assert.match(plan[0].title, /1930/);
  assert.equal(timingBanner({ situation: "upi", timing: "old" }).level, "warn");
});

test("liability note only appears with money lost and carries the authorised caveat", () => {
  assert.equal(liabilityNote({ situation: "hacked" }), null);
  const n = liabilityNote({ situation: "card", timing: "day" });
  assert.ok(n.points.some((p) => /3 working days/.test(p)));
  assert.ok(n.points.some((p) => /not guaranteed/.test(p)));
});

test("paid flag turns a non-money situation into a loss", () => {
  assert.equal(lostMoney({ situation: "arrest" }), false);
  assert.equal(lostMoney({ situation: "arrest", paid: true }), true);
  assert.match(buildPlan({ situation: "arrest", paid: true, timing: "hour" })[0].title, /1930/);
});

test("digital arrest without payment tells you to hang up and has no bank steps", () => {
  const plan = buildPlan({ situation: "arrest" });
  assert.match(plan[0].title, /End the call/);
  assert.ok(!plan.some((s) => /bank's fraud line/.test(s.title)));
});

test("remote access plan starts with disconnecting", () => {
  assert.match(buildPlan({ situation: "remote" })[0].title, /Disconnect/);
});

test("every situation yields a numbered plan", () => {
  for (const s of SITUATIONS) {
    const plan = buildPlan({ situation: s.id, timing: "day" });
    assert.ok(plan.length >= 3, s.id);
    plan.forEach((st, i) => assert.equal(st.n, i + 1));
    assert.ok(evidenceList({ situation: s.id }).length >= 2);
  }
});

test("sextortion advises not paying and links StopNCII", () => {
  const plan = buildPlan({ situation: "sextortion" });
  assert.match(plan[0].title, /not pay/i);
  assert.ok(plan.some((s) => s.link && /stopncii/.test(s.link.href)));
});

test("complaint and bank letters fill details and leave placeholders", () => {
  const a = { situation: "upi", timing: "hour" };
  const c = buildComplaint(a, { amount: "4999", txn: "UTR123", payee: "x@ybl" });
  assert.match(c, /₹4999/);
  assert.match(c, /UTR123/);
  assert.match(c, /\[date and time\]/);
  const l1 = buildBankLetter(a, { bank: "SBI", amount: "₹4999" }, "unauthorised");
  assert.match(l1, /6 July 2017/);
  assert.match(l1, /₹4999/);
  const l2 = buildBankLetter(a, { bank: "SBI" }, "deceived");
  assert.match(l2, /beneficiary bank/);
  assert.ok(!/6 July 2017/.test(l2));
});
