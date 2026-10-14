// Builds a "this result looks wrong" report. Nothing is sent anywhere: the user opens a pre-filled GitHub issue
// themselves, or copies the text. The message text is only included if the user explicitly opts in.

const MAX_TEXT = 1500;
const MAX_URL = 7000;

const KINDS = {
  missed: "It missed a scam",
  false_alarm: "It flagged a normal message",
  other: "Something else is wrong",
};
export const REPORT_KINDS = Object.entries(KINDS).map(([id, label]) => ({ id, label }));

export function buildReportText({ tool, kind, summary = [], note = "", includeText = false, text = "" }) {
  const lines = [
    `Tool: ${tool}`,
    `What went wrong: ${KINDS[kind] || KINDS.other}`,
    "",
    "Result shown:",
    ...summary.map((l) => `- ${l}`),
    "",
    "Details (what should it have said?):",
    note.trim() || "(not provided)",
  ];
  if (includeText && text.trim()) {
    lines.push("", "Message (shared by the reporter; remove personal details before posting):", "```", text.trim().slice(0, MAX_TEXT), "```");
  } else {
    lines.push("", "Message text: not included.");
  }
  return lines.join("\n");
}

export function buildIssueUrl(repo, args) {
  const title = `Wrong result: ${args.tool} (${KINDS[args.kind] || KINDS.other})`;
  let body = buildReportText(args);
  let url = `${repo}/issues/new?title=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}`;
  // Very long messages can exceed URL limits; drop the message text rather than fail.
  if (url.length > MAX_URL) {
    body = buildReportText({ ...args, includeText: false });
    url = `${repo}/issues/new?title=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}`;
  }
  return url;
}
