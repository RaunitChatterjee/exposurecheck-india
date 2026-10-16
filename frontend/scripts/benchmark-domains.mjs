// Usage: npm run benchmark:domains
// Prints results for the development set (the checker was built and tuned against it) and the held-out set
// (written after the checker's logic and list were frozen).
import { readFileSync } from "node:fs";
import { analyzeDomain } from "../src/lib/domains.js";
import { evaluateDomains, domainsToMarkdown } from "../src/lib/benchmark.js";

const load = (f) => JSON.parse(readFileSync(new URL(`../test-data/${f}`, import.meta.url), "utf8"));
for (const [title, file] of [["Development set", "domains-dev.json"], ["Held-out set", "domains-heldout.json"]]) {
  console.log(`## ${title}\n`);
  console.log(domainsToMarkdown(evaluateDomains(load(file), analyzeDomain)));
  console.log("");
}
