import test from "node:test";
import assert from "node:assert/strict";
import { analyzeDomain, parseTarget, splitHost, editDistance, deLeet, LIST_SUMMARY } from "./domains.js";
import { ORGS } from "./orgs.js";

const v = (x) => analyzeDomain(x).verdict?.id;

test("parsing links, emails and bare domains", () => {
  assert.equal(parseTarget("https://www.Example.com:8080/a?b=1").host, "example.com");
  assert.equal(parseTarget("someone@hdfc.bank.in").kind, "email");
  assert.equal(parseTarget("someone@hdfc.bank.in").host, "hdfc.bank.in");
  assert.equal(parseTarget("https://sbi.co.in@evil.com/x").userinfo, true);
  assert.equal(parseTarget("https://sbi.co.in@evil.com/x").host, "evil.com");
  assert.equal(parseTarget("").ok, false);
  assert.equal(parseTarget("not a domain").ok, false);
  assert.equal(analyzeDomain("???").ok, false);
});

test("registrable domain handles Indian suffixes and free hosts", () => {
  assert.equal(splitHost("a.b.example.co.in").registrable, "example.co.in");
  assert.equal(splitHost("hdfc.bank.in").registrable, "hdfc.bank.in");
  assert.equal(splitHost("sbi-kyc.vercel.app").free, true);
  assert.equal(splitHost("sbi-kyc.vercel.app").name, "sbi-kyc");
});

test("official addresses are recognised, including subdomains and old bank addresses", () => {
  assert.equal(v("https://www.hdfc.bank.in/login"), "official");
  assert.equal(v("netbanking.hdfc.bank.in"), "official");
  assert.equal(v("incometax.gov.in"), "official");
  assert.equal(v("amazon.in"), "official");
  const old = analyzeDomain("hdfcbank.com");
  assert.equal(old.verdict.id, "official");
  assert.match(old.findings[0].title, /old official address/);
});

test("the list is well formed", () => {
  const ids = new Set();
  for (const o of ORGS) {
    assert.ok(!ids.has(o.id), o.id); ids.add(o.id);
    assert.ok(o.official.length && o.words.length && o.name, o.id);
    if (o.type === "bank") assert.ok(o.official.every((d) => d.endsWith(".bank.in")), o.id);
    assert.ok(["fetched", "known"].includes(o.check), o.id);
  }
  assert.ok(LIST_SUMMARY.length >= 30);
});

test("look-alikes, brand misuse and tricks are caught", () => {
  assert.equal(v("hdfc-kyc-update.xyz"), "suspicious");
  assert.equal(v("http://sbi.co.in.verify-now.top/login"), "suspicious");
  assert.equal(v("paytrn.com"), "suspicious");
  assert.equal(v("amaz0n-offers.in"), "suspicious");
  assert.equal(v("amazan.in"), "suspicious");
  assert.equal(v("https://sbi.co.in@evil.com"), "suspicious");
  assert.equal(v("http://192.168.4.5/login"), "suspicious");
  assert.equal(v("xn--sbi-9ua.in"), "suspicious");
  assert.equal(v("support.hdfc@gmail.com"), "suspicious");
  assert.equal(v("sbi-support.netlify.app"), "suspicious");
  assert.equal(v("incometax-refund.in"), "suspicious");
});

test("plain brand mismatch without other signs is softer", () => {
  const r = analyzeDomain("trai.in");
  assert.equal(r.verdict.id, "mismatch");
});

test("unrelated and similar-looking real names are not accused", () => {
  assert.equal(v("example.com"), "unknown");
  assert.equal(v("taxisafe.com"), "unknown");
  assert.equal(v("trainers.in"), "unknown");
  assert.equal(v("kodak.com"), "unknown");
  assert.equal(v("axes.in"), "unknown");
  assert.equal(v("wikipedia.org"), "unknown");
});

test("unknown is never described as safe", () => {
  const r = analyzeDomain("example.com");
  assert.doesNotMatch(JSON.stringify(r), /\bsafe\b.*\btrust\b|is safe|looks safe/i);
  assert.match(r.findings.map((f) => f.detail).join(" "), /not necessarily safe/);
});

test("shorteners and risky endings give caution", () => {
  assert.equal(v("bit.ly/abc"), "caution");
  assert.equal(v("quickparcel.top"), "caution");
});

test("helpers", () => {
  assert.equal(editDistance("paytm", "paytn"), 1);
  assert.equal(editDistance("ab", "ba"), 1);
  assert.equal(deLeet("paytrn"), "paytm");
  assert.equal(deLeet("amaz0n"), "amazon");
});
