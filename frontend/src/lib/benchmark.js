// Scores the scam checker against a labelled message set.
// A message counts as "flagged" when the checker rates it "Likely a scam" or worse (score >= 40).
const RANK = { none: 0, caution: 1, likely: 2, high: 3 };
export const isFlagged = (r) => RANK[r.level.id] >= RANK.likely;

export function evaluate(dataset, analyze) {
  const scams = dataset.filter((d) => d.label === "scam");
  const legit = dataset.filter((d) => d.label === "legit");
  const rows = dataset.map((d) => ({ ...d, result: analyze(d.text) }));
  const missed = rows.filter((r) => r.label === "scam" && !isFlagged(r.result));
  const falseAlarms = rows.filter((r) => r.label === "legit" && isFlagged(r.result));
  const legitCaution = rows.filter((r) => r.label === "legit" && r.result.level.id === "caution");
  const byCategory = {};
  for (const r of rows.filter((x) => x.label === "scam")) {
    const c = (byCategory[r.category] ||= { total: 0, flagged: 0 });
    c.total += 1;
    if (isFlagged(r.result)) c.flagged += 1;
  }
  const byLanguage = {};
  for (const r of rows.filter((x) => x.label === "scam")) {
    const c = (byLanguage[r.language] ||= { total: 0, flagged: 0 });
    c.total += 1;
    if (isFlagged(r.result)) c.flagged += 1;
  }
  return {
    scamTotal: scams.length, legitTotal: legit.length,
    flagged: scams.length - missed.length, recall: scams.length ? (scams.length - missed.length) / scams.length : 0,
    falseAlarms, legitCaution, missed, byCategory, byLanguage,
  };
}

export function toMarkdown(res) {
  const pct = (a, b) => `${a}/${b} (${b ? Math.round((a / b) * 100) : 0}%)`;
  const out = [];
  out.push(`Scams flagged as "Likely" or worse: **${pct(res.flagged, res.scamTotal)}**`);
  out.push(`Normal messages wrongly flagged: **${pct(res.falseAlarms.length, res.legitTotal)}** (plus ${res.legitCaution.length} rated only "Suspicious")`);
  out.push("", "| Scam type | Flagged |", "|---|---|");
  for (const [k, v] of Object.entries(res.byCategory)) out.push(`| ${k} | ${v.flagged}/${v.total} |`);
  out.push("", "| Language | Flagged |", "|---|---|");
  for (const [k, v] of Object.entries(res.byLanguage)) out.push(`| ${k} | ${v.flagged}/${v.total} |`);
  if (res.missed.length) {
    out.push("", "Missed scams:");
    for (const m of res.missed) out.push(`- ${m.id} (${m.category}, ${m.language}), scored ${m.result.score}`);
  }
  if (res.falseAlarms.length) {
    out.push("", "Wrongly flagged normal messages:");
    for (const m of res.falseAlarms) out.push(`- ${m.id} (${m.category}), scored ${m.result.score}`);
  }
  return out.join("\n");
}

// ---------- website checker ----------
// Labels: "official" (an address that belongs to a listed organisation), "fake" (a look-alike or other imitation),
// "legit-other" (a real site that is not on the list). A result is "flagged" when the checker says
// suspicious, "not the official address" or caution; "hard" means suspicious.
const FLAGGED = new Set(["suspicious", "mismatch", "caution"]);

export function evaluateDomains(dataset, analyze) {
  const rows = dataset.map((d) => ({ ...d, result: analyze(d.input) }));
  const verdict = (r) => (r.result.ok ? r.result.verdict.id : "error");
  const of = (label) => rows.filter((r) => r.label === label);
  const official = of("official"), fake = of("fake"), other = of("legit-other");
  const officialMissed = official.filter((r) => verdict(r) !== "official");
  const fakeMissed = fake.filter((r) => !FLAGGED.has(verdict(r)));
  const fakeHard = fake.filter((r) => verdict(r) === "suspicious");
  const otherHard = other.filter((r) => verdict(r) === "suspicious");
  const otherSoft = other.filter((r) => ["mismatch", "caution"].includes(verdict(r)));
  const byCat = {};
  for (const r of fake) {
    const c = (byCat[r.category] ||= { total: 0, flagged: 0 });
    c.total += 1; if (FLAGGED.has(verdict(r))) c.flagged += 1;
  }
  const label = (r) => `${r.input} -> ${verdict(r)}`;
  return {
    counts: { official: official.length, fake: fake.length, other: other.length },
    officialRecognised: official.length - officialMissed.length, officialMissed: officialMissed.map(label),
    fakeFlagged: fake.length - fakeMissed.length, fakeHard: fakeHard.length, fakeMissed: fakeMissed.map(label),
    otherHard: otherHard.map(label), otherSoft: otherSoft.map(label), byCat,
  };
}

export function domainsToMarkdown(res) {
  const pct = (a, b) => `${a}/${b} (${b ? Math.round((a / b) * 100) : 0}%)`;
  const out = [];
  out.push(`Official addresses recognised as official: **${pct(res.officialRecognised, res.counts.official)}**`);
  out.push(`Fake addresses flagged (suspicious, not the official address, or caution): **${pct(res.fakeFlagged, res.counts.fake)}**, of which rated "suspicious": ${pct(res.fakeHard, res.counts.fake)}`);
  out.push(`Real sites not on the list called "suspicious": **${pct(res.otherHard.length, res.counts.other)}**; given a softer warning ("not the official address" or caution): **${pct(res.otherSoft.length, res.counts.other)}**`);
  out.push("", "| Fake type | Flagged |", "|---|---|");
  for (const [k, v] of Object.entries(res.byCat)) out.push(`| ${k} | ${v.flagged}/${v.total} |`);
  const list = (title, arr) => { if (arr.length) { out.push("", `${title}:`); for (const a of arr) out.push(`- ${a}`); } };
  list("Official addresses not recognised", res.officialMissed);
  list("Fake addresses not flagged", res.fakeMissed);
  list("Real sites called suspicious", res.otherHard);
  list("Real sites given a softer warning", res.otherSoft);
  return out.join("\n");
}
