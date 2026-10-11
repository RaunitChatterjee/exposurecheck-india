const BASE = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

export async function scan(email, domain) {
  let res;
  try {
    res = await fetch(`${BASE}/api/scan`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, domain: domain || null }),
    });
  } catch {
    throw new Error("Could not reach the server. Check your connection and try again.");
  }
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg =
      body.error ||
      (Array.isArray(body.detail) ? "Check the email and domain you entered." : body.detail) ||
      "Something went wrong. Try again in a moment.";
    const err = new Error(msg);
    if (res.status === 429) err.retryAfter = parseInt(res.headers.get("Retry-After") || "30", 10);
    throw err;
  }
  return body;
}

export async function getStats() {
  try {
    const res = await fetch(`${BASE}/api/stats`);
    return res.ok ? await res.json() : null;
  } catch {
    return null;
  }
}
