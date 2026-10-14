import test from "node:test";
import assert from "node:assert/strict";
import { cleanOcrText, checkImageFile } from "./ocr.js";

test("cleanOcrText tidies spacing and url protocols", () => {
  assert.equal(cleanOcrText("Dear   user,\r\n\r\n\r\n\r\nclick  HTTP : // bit.ly/abc  now"), "Dear user,\n\nclick http://bit.ly/abc now");
  assert.equal(cleanOcrText(""), "");
  assert.equal(cleanOcrText(undefined), "");
  assert.equal(cleanOcrText("line one |\nline two"), "line one\nline two");
});

test("checkImageFile validates type and size", () => {
  assert.ok(checkImageFile(null));
  assert.ok(checkImageFile({ type: "application/pdf", size: 10 }));
  assert.ok(checkImageFile({ type: "image/png", size: 20 * 1024 * 1024 }));
  assert.equal(checkImageFile({ type: "image/png", size: 1000 }), null);
});
