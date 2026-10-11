import test from "node:test";
import assert from "node:assert/strict";
import { addressOf, analyzeHeaders, parseHeaders } from "./headers.js";

const GOOD = `Received: from mail.example.com (mail.example.com [203.0.113.5])
 by mx.google.com with ESMTPS; Tue, 06 Oct 2026 10:00:05 +0000
Received: from [10.0.0.2] (unknown [10.0.0.2]) by mail.example.com with SMTP; Tue, 06 Oct 2026 10:00:01 +0000
Authentication-Results: mx.google.com; spf=pass smtp.mailfrom=example.com; dkim=pass header.d=example.com; dmarc=pass header.from=example.com
Return-Path: <news@example.com>
From: Example News <news@example.com>
Subject: Hello
Date: Tue, 06 Oct 2026 10:00:00 +0000

Body text with Received: inside should be ignored`;

const SPOOF = `Received: from evil.example.net (evil.example.net [198.51.100.9]) by mx.google.com; Tue, 06 Oct 2026 10:00:05 +0000
Authentication-Results: mx.google.com; spf=fail smtp.mailfrom=evil.example.net; dkim=none; dmarc=fail header.from=sbi.co.in
Return-Path: <bounce@evil.example.net>
Reply-To: <collect@gmail.com>
From: "support@sbi.co.in" <alerts@evil.example.net>
Subject: Account blocked`;

test("parseHeaders unfolds and stops at the body", () => {
  const h = parseHeaders(GOOD);
  assert.equal(h.get("received").length, 2);
  assert.match(h.get("received")[0], /ESMTPS; Tue/);
  assert.equal(h.get("subject")[0], "Hello");
});

test("addressOf handles names, brackets and bare addresses", () => {
  assert.equal(addressOf('"A B" <X@Mail.Com>').domain, "mail.com");
  assert.equal(addressOf("plain@x.org").email, "plain@x.org");
  assert.equal(addressOf(""), null);
});

test("authenticated message has no bad findings and finds origin hop IP", () => {
  const r = analyzeHeaders(GOOD);
  assert.ok(r.ok);
  assert.equal(r.verdict.id, "none");
  assert.ok(r.findings.some((f) => f.severity === "ok"));
  assert.equal(r.originIp, "203.0.113.5");
  assert.equal(r.hops.length, 2);
});

test("spoofed message is flagged on several counts", () => {
  const r = analyzeHeaders(SPOOF);
  const titles = r.findings.map((f) => f.title).join(" | ");
  assert.equal(r.verdict.id, "high");
  assert.match(titles, /Authentication failed: SPF fail, DMARC fail/);
  assert.match(titles, /Display name shows a different email address/);
  assert.match(titles, /Reply-To/);
});

test("missing auth and non-headers are handled", () => {
  assert.equal(analyzeHeaders("hello world").ok, false);
  const r = analyzeHeaders("From: a@b.com\nSubject: x");
  assert.ok(r.findings.some((f) => /No authentication results/.test(f.title)));
});
