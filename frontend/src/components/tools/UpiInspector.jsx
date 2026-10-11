import { Fragment, useRef, useState } from "react";
import ToolShell from "./ToolShell.jsx";
import Section from "../Section.jsx";
import { parseUpi, analyzeUpi } from "../../lib/upi.js";

const SEV = { bad: "Problem", warn: "Check", ok: "Good", info: "Note" };
const EXAMPLE = "upi://collect?pa=refund.support@ybl&pn=Customer Care Refund&am=4999&cu=INR&tn=Refund approval";

// Decode a QR from an image file entirely in the browser. jsQR is loaded only when needed.
async function decodeQr(file) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1200 / Math.max(bitmap.width, bitmap.height));
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(bitmap, 0, 0, w, h);
  const { default: jsQR } = await import("jsqr");
  const img = ctx.getImageData(0, 0, w, h);
  const hit = jsQR(img.data, w, h, { inversionAttempts: "attemptBoth" });
  return hit ? hit.data : null;
}

export default function UpiInspector() {
  const [text, setText] = useState("");
  const [decoded, setDecoded] = useState(null);
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [drag, setDrag] = useState(false);
  const fileRef = useRef(null);

  function inspect(raw) { setResult(analyzeUpi(parseUpi(raw))); }

  async function onFile(file) {
    if (!file) return;
    setResult(null); setDecoded(null);
    if (!file.type.startsWith("image/")) { setResult({ ok: false, error: "Please choose an image file (PNG or JPG screenshot or photo of the QR)." }); return; }
    setBusy(true);
    try {
      const data = await decodeQr(file);
      if (!data) { setResult({ ok: false, error: "We could not find a QR code in that image. Try a sharper, closer screenshot, or paste the link text instead." }); return; }
      setDecoded(data); setText(data); inspect(data);
    } catch {
      setResult({ ok: false, error: "That image could not be read. Try a PNG or JPG, or paste the link text instead." });
    } finally { setBusy(false); }
  }

  return (
    <ToolShell
      title="What will this UPI QR or link do?"
      intro="Upload a screenshot of a QR code, or paste a upi:// link or UPI ID. We read the code and tell you in plain words whether it sends money, asks to collect money from you, or sets up an auto-debit, before you scan it in your payment app."
      privacy="Images are decoded in your browser and never uploaded. We read what is written in the code; we cannot see who really owns the account, so always check the payee name your app shows. Camera scanning is not built in: screenshot the QR instead.">
      <div className="notice notice-warn golden"><b>Golden rule:</b> you never need to scan a QR code, approve a request or enter your UPI PIN to <em>receive</em> money.</div>

      <div className="panel scan">
        <div className={`drop ${drag ? "drop-on" : ""}`}
             onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
             onDragLeave={() => setDrag(false)}
             onDrop={(e) => { e.preventDefault(); setDrag(false); onFile(e.dataTransfer.files?.[0]); }}>
          <p>{busy ? "Reading QR code…" : "Drop a QR screenshot here"}</p>
          <button type="button" className="btn btn-quiet" disabled={busy} onClick={() => fileRef.current?.click()}>Choose image</button>
          <input ref={fileRef} type="file" accept="image/*" hidden aria-label="QR code image" onChange={(e) => { onFile(e.target.files?.[0]); e.target.value = ""; }} />
        </div>
        <form onSubmit={(e) => { e.preventDefault(); setDecoded(null); inspect(text); }}>
          <label htmlFor="upi">Or paste a UPI link or ID</label>
          <textarea id="upi" rows={3} maxLength={2000} spellCheck="false" className="mono" value={text}
                    placeholder="upi://pay?pa=name@bank&pn=Name&am=100"
                    onChange={(e) => { setText(e.target.value); setResult(null); setDecoded(null); }} />
          <div className="row row-end">
            <button className="btn" type="submit" disabled={!text.trim() || busy}>Inspect</button>
            <button type="button" className="textbtn" onClick={() => { setText(EXAMPLE); setResult(null); setDecoded(null); }}>Try an example</button>
          </div>
        </form>
      </div>

      {decoded && <p className="fine decoded">QR contained: <code>{decoded}</code></p>}
      {result && !result.ok && <div className="notice notice-warn" role="alert">{result.error}</div>}
      {result && result.ok && (
        <div className="result-wrap">
          <div className={`result result-${result.verdict.id}`} role="status">
            <h2>{result.verdict.label}</h2>
            <p>{result.headline}</p>
          </div>
          <ul className="signals">
            {result.findings.map((f, i) => (
              <li key={i}><span className={`sev sev-${f.severity}`}>{SEV[f.severity]}</span><h3>{f.title}</h3><p>{f.detail}</p></li>
            ))}
          </ul>
          <Section title="What the code says">
            <dl className="kv">{result.facts.map(([k, v]) => (<Fragment key={k}><dt>{k}</dt><dd>{v}</dd></Fragment>))}</dl>
          </Section>
          <Section title="Before you pay">
            <ul className="plain">
              <li>Check that the payee name your app shows is who you expect.</li>
              <li>If anyone is pressuring you, claiming a refund, or says you must scan to receive money, stop.</li>
              <li>If you already paid, call <b>1930</b> straight away and use the “I've been scammed” tab.</li>
            </ul>
          </Section>
        </div>
      )}
    </ToolShell>
  );
}
