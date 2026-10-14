import test from "node:test";
import assert from "node:assert/strict";
import { buildReportText, buildIssueUrl } from "./report.js";

const base = { tool: "Scam message checker", kind: "missed", summary: ["Level: No strong scam signals found", "Score: 0"], note: "It is a fake job offer", text: "Earn 5000 daily, join telegram" };

test("message text is excluded unless the user opts in", () => {
  const t = buildReportText(base);
  assert.ok(!t.includes("Earn 5000"));
  assert.match(t, /not included/);
  const t2 = buildReportText({ ...base, includeText: true });
  assert.ok(t2.includes("Earn 5000 daily"));
});

test("report text names the tool, problem and result", () => {
  const t = buildReportText(base);
  assert.match(t, /Tool: Scam message checker/);
  assert.match(t, /It missed a scam/);
  assert.match(t, /Score: 0/);
});

test("issue URL is encoded and points at the repo", () => {
  const u = buildIssueUrl("https://github.com/o/r", base);
  assert.ok(u.startsWith("https://github.com/o/r/issues/new?title="));
  assert.ok(!u.includes(" "));
  assert.ok(decodeURIComponent(u).includes("It is a fake job offer"));
});

test("an oversized message is dropped so the URL stays usable", () => {
  const u = buildIssueUrl("https://github.com/o/r", { ...base, includeText: true, text: "é".repeat(5000) });
  assert.ok(u.length <= 7000);
});

test("very long messages are truncated in the report text", () => {
  const t = buildReportText({ ...base, includeText: true, text: "a".repeat(5000) });
  assert.ok(t.length < 2200);
});
