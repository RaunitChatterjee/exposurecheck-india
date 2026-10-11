// Pwned Passwords check using k-anonymity: only the first 5 characters of the SHA-1 hash leave the browser.

export async function sha1Hex(text) {
  if (!globalThis.crypto || !globalThis.crypto.subtle) {
    throw new Error("This browser cannot hash passwords securely here. Use https or localhost.");
  }
  const digest = await globalThis.crypto.subtle.digest("SHA-1", new TextEncoder().encode(text));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("").toUpperCase();
}

export function countInRange(body, suffix) {
  for (const line of body.split(/\r?\n/)) {
    const [s, c] = line.trim().split(":");
    if (s === suffix) return parseInt(c, 10) || 0;
  }
  return 0;
}

export async function pwnedCount(password, fetchImpl = globalThis.fetch) {
  const hash = await sha1Hex(password);
  let res;
  try {
    res = await fetchImpl(`https://api.pwnedpasswords.com/range/${hash.slice(0, 5)}`);
  } catch {
    throw new Error("Could not reach the password database. Check your connection.");
  }
  if (!res.ok) throw new Error("The password database returned an error. Try again shortly.");
  return countInRange(await res.text(), hash.slice(5));
}
