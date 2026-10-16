import test from "node:test";
import assert from "node:assert/strict";
import { buildShare, toneFor, defang, wrapLines, whatsappUrl, SHARE_LANGS } from "./verdictshare.js";
import { analyzeMessage } from "./scam.js";

const msg = "Dear SBI customer, your account will be blocked today. Update your KYC immediately: http://sbi-kyc-update.xyz/login";

test("only warnings are shareable, never reassurance", () => {
  assert.equal(toneFor("message", "none"), null);
  assert.equal(toneFor("website", "official"), null);
  assert.equal(toneFor("website", "unknown"), null);
  assert.equal(toneFor("upi", "none"), null);
  assert.equal(toneFor("message", "high"), "danger");
  assert.equal(toneFor("website", "mismatch"), "warn");
  assert.equal(buildShare({ kind: "message", level: "none", signs: [] }), null);
});

test("message share carries signs and advice but not the message or its link", () => {
  const r = analyzeMessage(msg);
  const s = buildShare({ kind: "message", level: r.level.id, signs: r.signals, lang: "en" });
  assert.match(s.text, /looks like a scam/);
  assert.match(s.text, /1930/);
  assert.match(s.text, /exposurecheck-india\.vercel\.app/);
  assert.doesNotMatch(s.text, /sbi-kyc-update/);
  assert.doesNotMatch(s.text, /account will be blocked/);
  assert.ok(s.why.length >= 2 && s.why.length <= 4);
});

test("strongest signs come first and are deduplicated", () => {
  const s = buildShare({ kind: "message", level: "high", signs: [{ id: "urgency", label: "Pressure", weight: 10 }, { id: "otp", label: "OTP", weight: 45 }, { id: "otp", label: "OTP", weight: 45 }] });
  assert.deepEqual(s.why, ["OTP", "Pressure"]);
});

test("Hinglish and Hindi translate known signs and wrappers", () => {
  const r = analyzeMessage(msg);
  const hi = buildShare({ kind: "message", level: r.level.id, signs: r.signals, lang: "hi" });
  assert.match(hi.title, /[ऀ-ॿ]/);
  assert.ok(hi.why.some((w) => /[ऀ-ॿ]/.test(w)));
  const hg = buildShare({ kind: "message", level: r.level.id, signs: r.signals, lang: "hinglish" });
  assert.doesNotMatch(hg.text, /[ऀ-ॿ]/);
  assert.match(hg.text, /1930/);
  assert.equal(buildShare({ kind: "message", level: "high", signs: [{ id: "zzz", label: "Custom sign" }], lang: "hi" }).why[0], "Custom sign");
});

test("website share defangs the address", () => {
  assert.equal(defang("https://hdfc-kyc-update.xyz/login"), "hxxps://hdfc-kyc-update[.]xyz/login");
  const s = buildShare({ kind: "website", level: "suspicious", signs: [{ label: "Uses the name HDFC Bank but is not its address" }], address: "hdfc-kyc-update.xyz" });
  assert.match(s.text, /hdfc-kyc-update\[\.\]xyz/);
  assert.doesNotMatch(s.text, /hdfc-kyc-update\.xyz/);
});

test("every language has the full wording for every kind and tone", () => {
  for (const { id } of SHARE_LANGS) for (const kind of ["message", "website", "upi"]) for (const level of ["high", "suspicious", "caution", "likely", "mismatch"]) {
    const s = buildShare({ kind, level, signs: [{ id: "otp", label: "x" }], lang: id });
    if (toneFor(kind, level)) { assert.ok(s.title && s.todo.length === 3 && s.footer, `${id} ${kind} ${level}`); assert.doesNotMatch(s.text, /undefined/); }
  }
});

test("wrapLines wraps by measured width and keeps paragraphs", () => {
  const measure = (t) => t.length * 10;
  assert.deepEqual(wrapLines("aaa bbb ccc", 70, measure), ["aaa bbb", "ccc"]);
  assert.deepEqual(wrapLines("one\ntwo", 500, measure), ["one", "two"]);
  assert.deepEqual(wrapLines("supercalifragilistic", 50, measure), ["supercalifragilistic"]);
});

test("whatsapp link encodes the text", () => {
  assert.equal(whatsappUrl("a b&c"), "https://wa.me/?text=a%20b%26c");
});
