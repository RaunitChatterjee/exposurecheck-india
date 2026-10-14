// Usage: npm run benchmark
// Prints results for the development set (the rules were tuned against it) and the held-out set (written after the rules were frozen).
import { readFileSync } from "node:fs";
import { analyzeMessage } from "../src/lib/scam.js";
import { evaluate, toMarkdown } from "../src/lib/benchmark.js";

const load = (f) => JSON.parse(readFileSync(new URL(`../test-data/${f}`, import.meta.url), "utf8"));
for (const [title, file] of [["Development set", "scam-messages.json"], ["Held-out set", "scam-messages-heldout.json"]]) {
  console.log(`## ${title}\n`);
  console.log(toMarkdown(evaluate(load(file), analyzeMessage)));
  console.log("");
}
