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
