// Reads text from a screenshot entirely in the browser (tesseract.js, English + Hindi).
// The engine and language files are served from this site's own /ocr folder, not a third-party CDN,
// and the image never leaves the device. The engine is only downloaded when someone uses this feature.

export const OCR_DOWNLOAD_MB = 9;
export const MAX_IMAGE_BYTES = 15 * 1024 * 1024;

// Tidy common OCR noise so the checker sees normal text. Pure function, tested.
export function cleanOcrText(raw = "") {
  return String(raw)
    .replace(/\r/g, "")
    .replace(/[|¦]{1,2}(?=\s|$)/g, " ")
    .replace(/\bhttps?\s*:\s*\/\s*\/\s*/gi, (m) => m.toLowerCase().replace(/\s+/g, ""))
    .replace(/[ \t]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function checkImageFile(file) {
  if (!file) return "Choose an image first.";
  if (!file.type || !file.type.startsWith("image/")) return "Please choose an image file (PNG or JPG screenshot).";
  if (file.size > MAX_IMAGE_BYTES) return "That image is too large. Try a smaller screenshot (under 15 MB).";
  return null;
}

let workerPromise = null;

async function getWorker(onProgress) {
  const { createWorker } = await import("tesseract.js");
  const base = `${import.meta.env.BASE_URL || "/"}ocr`.replace(/\/{2,}/g, "/");
  return createWorker(["eng", "hin"], 1, {
    workerPath: `${base}/worker.min.js`,
    corePath: base,
    langPath: `${base}/lang`,
    gzip: true,
    logger: (m) => onProgress && onProgress(m),
  });
}

export async function readScreenshot(file, onProgress) {
  const problem = checkImageFile(file);
  if (problem) throw new Error(problem);
  if (!workerPromise) workerPromise = getWorker((m) => onProgress && onProgress(m));
  let worker;
  try { worker = await workerPromise; } catch (e) { workerPromise = null; throw e; }
  const { data } = await worker.recognize(file);
  return { text: cleanOcrText(data.text), confidence: Math.round(data.confidence || 0) };
}
