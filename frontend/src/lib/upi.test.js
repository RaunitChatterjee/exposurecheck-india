import test from "node:test";
import assert from "node:assert/strict";
import { analyzeUpi, handleOf, parseUpi } from "./upi.js";

const sev = (r) => r.findings.map((f) => f.severity);

test("parses a normal pay link", () => {
  const p = parseUpi("upi://pay?pa=ravi@okhdfcbank&pn=Ravi%20Kumar&am=250.00&cu=INR&tn=Lunch");
  assert.equal(p.kind, "link");
  assert.equal(p.action, "pay");
  assert.equal(p.pa, "ravi@okhdfcbank");
  assert.equal(p.pn, "Ravi Kumar");
  assert.equal(p.am, "250.00");
});

test("a pre-filled amount is explained as money leaving", () => {
  const r = analyzeUpi(parseUpi("upi://pay?pa=ravi@okhdfcbank&pn=Ravi%20Kumar&am=4999&cu=INR"));
  assert.ok(r.ok);
  assert.match(r.headline, /SEND ₹4,999/);
  assert.ok(r.findings.some((f) => /fixed amount/.test(f.title)));
  assert.equal(r.verdict.id, "caution");
});

test("collect requests are flagged as high risk", () => {
  const r = analyzeUpi(parseUpi("upi://collect?pa=refund.desk@ybl&pn=Refund%20Support&am=1&tn=Receive%20cashback"));
  assert.equal(r.verdict.id, "high");
  assert.ok(sev(r).includes("bad"));
  assert.ok(r.findings.some((f) => /official/.test(f.title)));
  assert.ok(r.findings.some((f) => /note mentions/.test(f.title)));
});

test("mandates are warned about", () => {
  const r = analyzeUpi(parseUpi("upi://mandate?pa=shop@paytm&pn=Shop&am=999"));
  assert.ok(r.findings.some((f) => /Auto-debit/.test(f.title)));
});

test("other app schemes and handle recognition", () => {
  const p = parseUpi("gpay://upi/pay?pa=a.b@oksbi&pn=A%20B");
  assert.equal(p.action, "pay");
  assert.equal(handleOf(p.pa), "oksbi");
  assert.ok(analyzeUpi(p).findings.some((f) => /Google Pay/.test(f.title)));
});

test("link embedded in surrounding text is found", () => {
  const p = parseUpi("Scan or tap: upi://pay?pa=x@ybl&pn=X&am=10 thanks!");
  assert.equal(p.pa, "x@ybl");
});

test("bare UPI ID is recognised", () => {
  const r = analyzeUpi(parseUpi("kamal.singh@paytm"));
  assert.ok(r.ok);
  assert.match(r.headline, /UPI ID/);
});

test("non-UPI input gives helpful errors", () => {
  assert.equal(analyzeUpi(parseUpi("")).ok, false);
  assert.match(analyzeUpi(parseUpi("https://example.com/pay")).error, /web link/);
  assert.match(analyzeUpi(parseUpi("hello there")).error, /does not look like/);
});

test("non-INR currency and embedded url are flagged", () => {
  const r = analyzeUpi(parseUpi("upi://pay?pa=x@ybl&pn=X&cu=USD&url=https%3A%2F%2Fevil.example"));
  assert.ok(sev(r).includes("bad"));
  assert.ok(r.findings.some((f) => /web link/.test(f.title)));
});

test("plain person-to-person code with no amount is mild", () => {
  const r = analyzeUpi(parseUpi("upi://pay?pa=meena@okicici&pn=Meena%20Devi"));
  assert.equal(r.verdict.id, "none");
});

test("links with raw spaces in the payee name keep every parameter", () => {
  const p = parseUpi("upi://collect?pa=a@ybl&pn=Customer Care Refund&am=4999&tn=Refund approval");
  assert.equal(p.pn, "Customer Care Refund");
  assert.equal(p.am, "4999");
  assert.equal(p.tn, "Refund approval");
});
