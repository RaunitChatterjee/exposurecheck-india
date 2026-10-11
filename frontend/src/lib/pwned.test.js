import test from "node:test";
import assert from "node:assert/strict";
import { countInRange, pwnedCount, sha1Hex } from "./pwned.js";

test("sha1 matches the known digest of 'password'", async () => {
  assert.equal(await sha1Hex("password"), "5BAA61E4C9B93F3F0682250B6CF8331B7EE68FD8");
});

test("countInRange finds the suffix or returns 0", () => {
  const body = "AAAA:3\r\n1E4C9B93F3F0682250B6CF8331B7EE68FD8:9545824\r\nBBBB:0";
  assert.equal(countInRange(body, "1E4C9B93F3F0682250B6CF8331B7EE68FD8"), 9545824);
  assert.equal(countInRange(body, "CCCC"), 0);
});

test("only the 5-character prefix is sent", async () => {
  let url = "";
  const fake = async (u) => { url = u; return { ok: true, text: async () => "1E4C9B93F3F0682250B6CF8331B7EE68FD8:42" }; };
  assert.equal(await pwnedCount("password", fake), 42);
  assert.equal(url, "https://api.pwnedpasswords.com/range/5BAA6");
  assert.ok(!url.includes("1E4C9B93F3F0682250B6CF8331B7EE68FD8"), "suffix must not be sent");
});

test("network failure and bad status become friendly errors", async () => {
  await assert.rejects(pwnedCount("x", async () => { throw new Error("net"); }), /Could not reach/);
  await assert.rejects(pwnedCount("x", async () => ({ ok: false })), /error/);
});
