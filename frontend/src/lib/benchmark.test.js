import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { analyzeMessage } from "./scam.js";
import { evaluate, toMarkdown } from "./benchmark.js";

const load = (f) => JSON.parse(readFileSync(new URL(`../../test-data/${f}`, import.meta.url), "utf8"));
const dev = load("scam-messages.json");
const held = load("scam-messages-heldout.json");

test("datasets are well formed and ids are unique", () => {
  const all = [...dev, ...held];
  assert.equal(new Set(all.map((d) => d.id)).size, all.length);
  for (const d of all) {
    assert.ok(["scam", "legit"].includes(d.label), d.id);
    assert.ok(d.text && d.category && d.language, d.id);
    assert.match(d.source, /synthetic/);
  }
  assert.ok(dev.every((d) => d.set === "dev") && held.every((d) => d.set === "heldout"));
});

// Regression floors: these catch a rule change that makes the checker worse. They are not accuracy claims.
test("regression floor: development set", () => {
  const r = evaluate(dev, analyzeMessage);
  assert.ok(r.recall >= 0.85, `recall ${r.recall}`);
  assert.equal(r.falseAlarms.length, 0);
});

test("regression floor: held-out set", () => {
  const r = evaluate(held, analyzeMessage);
  assert.ok(r.recall >= 0.8, `recall ${r.recall}`);
  assert.equal(r.falseAlarms.length, 0);
});

test("toMarkdown mentions totals", () => {
  assert.match(toMarkdown(evaluate(held, analyzeMessage)), /\/18/);
});
