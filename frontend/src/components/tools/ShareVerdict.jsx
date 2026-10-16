import { useMemo, useState } from "react";
import { SHARE_LANGS, buildShare, whatsappUrl, wrapLines } from "../../lib/verdictshare.js";

const FONT = '"Inter", "Noto Sans Devanagari", "Noto Sans", system-ui, -apple-system, "Segoe UI", sans-serif';
const COLORS = { danger: "#962b2c", warn: "#946310" };

// Draws the warning as a picture (for WhatsApp status or a family group) entirely in the browser.
function drawCard(share) {
  const W = 1080, PAD = 64;
  const probe = document.createElement("canvas").getContext("2d");
  const font = (size, weight = 400) => `${weight} ${size}px ${FONT}`;
  const measureWith = (size, weight) => (t) => { probe.font = font(size, weight); return probe.measureText(t).width; };

  const blocks = [];
  const title = wrapLines(share.title, W - PAD * 2, measureWith(46, 700));
  const section = (label, items) => {
    blocks.push({ size: 30, weight: 700, lines: [label], gap: 18, color: "#14463a" });
    for (const it of items) blocks.push({ size: 32, weight: 400, lines: wrapLines(`•  ${it}`, W - PAD * 2 - 8, measureWith(32, 400)), gap: 12, color: "#1b1f1d" });
    blocks.push({ size: 0, lines: [], gap: 18 });
  };
  if (share.address) blocks.push({ size: 32, weight: 700, lines: wrapLines(share.address, W - PAD * 2, measureWith(32, 700)), gap: 20, color: "#1b1f1d" });
  if (share.why.length) section(share.whyLabel, share.why);
  section(share.todoLabel, share.todo);
  const foot = wrapLines(share.footer, W - PAD * 2, measureWith(26, 400));

  const headH = PAD + title.length * 58 + 36;
  let bodyH = 36;
  for (const b of blocks) bodyH += b.lines.length * (b.size * 1.35) + b.gap;
  const H = Math.ceil(headH + bodyH + foot.length * 36 + PAD);

  const canvas = document.createElement("canvas");
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#f8f8f5"; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = COLORS[share.tone] || COLORS.warn; ctx.fillRect(0, 0, W, headH);
  ctx.fillStyle = "#ffffff"; ctx.textBaseline = "top"; ctx.font = font(46, 700);
  title.forEach((l, i) => ctx.fillText(l, PAD, PAD * 0.75 + i * 58));
  let y = headH + 36;
  for (const b of blocks) {
    ctx.fillStyle = b.color || "#000"; ctx.font = font(b.size || 1, b.weight);
    for (const l of b.lines) { ctx.fillText(l, PAD, y); y += b.size * 1.35; }
    y += b.gap;
  }
  ctx.fillStyle = "#555"; ctx.font = font(26, 400);
  foot.forEach((l, i) => ctx.fillText(l, PAD, y + 4 + i * 36));
  return canvas;
}

export default function ShareVerdict({ kind, level, signs, address = "" }) {
  const [lang, setLang] = useState("en");
  const [copied, setCopied] = useState(false);
  const [note, setNote] = useState("");
  const share = useMemo(() => buildShare({ kind, level, signs, lang, address }), [kind, level, signs, lang, address]);
  if (!share) return null;

  const canShare = typeof navigator !== "undefined" && typeof navigator.share === "function";

  async function copy() {
    try { await navigator.clipboard.writeText(share.text); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { setNote("Select the text above and copy it."); }
  }
  async function nativeShare() {
    try { await navigator.share({ text: share.text }); } catch { /* cancelled */ }
  }
  function download() {
    try {
      drawCard(share).toBlob((blob) => {
        if (!blob) { setNote("Could not make the image on this device. Use the text instead."); return; }
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob); a.download = "scam-warning.png";
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(a.href), 2000);
      }, "image/png");
    } catch { setNote("Could not make the image on this device. Use the text instead."); }
  }

  return (
    <section className="panel share noprint" aria-label="Warn someone">
      <h3>Warn someone</h3>
      <p className="fine">Send this to a family member or friend. It lists the warning signs only: {kind === "website" ? "the address is written with [.] so chat apps do not make it tappable" : "the message itself is not included"}. Nothing is uploaded; the buttons below just hand the text to your own apps.</p>
      <div className="row langs" role="group" aria-label="Language of the warning">
        {SHARE_LANGS.map((l) => (
          <button key={l.id} type="button" className={`textbtn lang ${lang === l.id ? "lang-on" : ""}`} aria-pressed={lang === l.id} onClick={() => setLang(l.id)}>{l.label}</button>
        ))}
      </div>
      <textarea readOnly rows={9} className="mono" value={share.text} aria-label="Warning text to share" lang={lang === "hi" ? "hi" : "en"} />
      <div className="row row-end">
        <a className="btn" href={whatsappUrl(share.text)} target="_blank" rel="noopener noreferrer">Send on WhatsApp</a>
        {canShare && <button type="button" className="btn btn-quiet" onClick={nativeShare}>Share…</button>}
        <button type="button" className="btn btn-quiet" onClick={copy}>{copied ? "Copied" : "Copy text"}</button>
        <button type="button" className="btn btn-quiet" onClick={download}>Save as image</button>
      </div>
      {note && <p className="fine" role="status">{note}</p>}
    </section>
  );
}
