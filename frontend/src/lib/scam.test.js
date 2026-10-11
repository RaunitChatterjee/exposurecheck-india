import test from "node:test";
import assert from "node:assert/strict";
import { analyzeMessage, extractUrls } from "./scam.js";

const ids = (r) => r.signals.map((s) => s.id);

test("classic KYC + lookalike link scores high", () => {
  const r = analyzeMessage("Dear customer, your SBI account will be blocked today. Update your KYC immediately: http://sbi-kyc-update.xyz/login");
  assert.ok(ids(r).includes("kyc") && ids(r).includes("urgency"));
  assert.ok(ids(r).some((i) => i.startsWith("brand-SBI")));
  assert.ok(ids(r).includes("tld"));
  assert.ok(r.score >= 70, `score ${r.score}`);
  assert.equal(r.level.id, "high");
});

test("official domain is not flagged as a lookalike", () => {
  const r = analyzeMessage("Your statement is ready: https://www.hdfcbank.com/statements");
  assert.ok(!ids(r).some((i) => i.startsWith("brand-")));
  assert.equal(r.level.id, "none");
});

test("subdomain trick on a non-official domain is flagged", () => {
  const r = analyzeMessage("Login at https://hdfcbank.com.verify-now.top/");
  assert.ok(ids(r).some((i) => i.startsWith("brand-HDFC")));
});

test("digital arrest and remote-access app", () => {
  const r = analyzeMessage("This is CBI. A warrant is pending. Install AnyDesk so we can verify your account. Do not tell anyone, digital arrest in progress.");
  assert.ok(ids(r).includes("authority") && ids(r).includes("remote"));
});

test("OTP requests are flagged but genuine OTP warnings are not", () => {
  assert.ok(ids(analyzeMessage("Please share the OTP you received")).includes("otp"));
  assert.ok(!ids(analyzeMessage("Your OTP is 123456. Do not share it with anyone.")).includes("otp"));
  assert.ok(!ids(analyzeMessage("Never share your OTP or PIN with anyone, including bank staff.")).includes("otp"));
  assert.ok(ids(analyzeMessage("Sir send me the OTP you just received, quickly")).includes("otp"));
});

test("collect request and QR for receiving money", () => {
  assert.ok(ids(analyzeMessage("Approve the collect request to receive your refund")).includes("collect"));
});

test("ordinary friendly message has no signals", () => {
  const r = analyzeMessage("Hey, are we still meeting at 6 for dinner? Let me know.");
  assert.equal(r.signals.length, 0);
  assert.equal(r.level.id, "none");
});

test("url helpers: IP host, shortener, apk, punycode, userinfo", () => {
  assert.ok(ids(analyzeMessage("Open http://192.168.4.7/pay")).includes("ip"));
  assert.ok(ids(analyzeMessage("see https://bit.ly/3xYz")).includes("shortener"));
  assert.ok(ids(analyzeMessage("download https://files.example.com/bank.apk")).includes("apk"));
  assert.ok(ids(analyzeMessage("https://xn--sb-kyc.com/")).includes("punycode"));
  assert.ok(ids(analyzeMessage("https://www.sbi.co.in@evil.com/login")).includes("userinfo"));
});

test("extractUrls strips trailing punctuation and dedupes", () => {
  assert.deepEqual(extractUrls("Go to https://a.com/x. Then https://a.com/x!"), ["https://a.com/x"]);
});
