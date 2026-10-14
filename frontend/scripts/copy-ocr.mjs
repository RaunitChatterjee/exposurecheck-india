// Copies the OCR engine and language data from node_modules into public/ocr so the browser loads
// everything from this site's own origin (no third-party CDN). Runs automatically before dev and build.
import { cpSync, mkdirSync, existsSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(root, "public", "ocr");
mkdirSync(join(out, "lang"), { recursive: true });

const pkgDir = (name) => dirname(require.resolve(`${name}/package.json`));
const jobs = [
  [join(pkgDir("tesseract.js"), "dist", "worker.min.js"), join(out, "worker.min.js")],
  [join(pkgDir("tesseract.js-core"), "tesseract-core-lstm.wasm.js"), join(out, "tesseract-core-lstm.wasm.js")],
  [join(pkgDir("tesseract.js-core"), "tesseract-core-simd-lstm.wasm.js"), join(out, "tesseract-core-simd-lstm.wasm.js")],
  [join(pkgDir("@tesseract.js-data/eng"), "4.0.0_best_int", "eng.traineddata.gz"), join(out, "lang", "eng.traineddata.gz")],
  [join(pkgDir("@tesseract.js-data/hin"), "4.0.0_best_int", "hin.traineddata.gz"), join(out, "lang", "hin.traineddata.gz")],
];
for (const [from, to] of jobs) {
  if (!existsSync(from)) { console.error(`copy-ocr: missing ${from}. Run npm install.`); process.exit(1); }
  cpSync(from, to);
}
console.log(`copy-ocr: copied ${jobs.length} files to public/ocr`);
