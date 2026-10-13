import { useEffect, useState } from "react";

// Visually distinct "work in progress" state: slow networks and a sleeping free server are expected.
export default function Loading() {
  const [secs, setSecs] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setSecs((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="loading" role="status" aria-live="polite">
      <div className="loading-bar" aria-hidden="true"><span /></div>
      <h2>Checking public sources</h2>
      <p>Looking up your email in a breach database. Please keep this page open.</p>
      {secs >= 6 && <p className="loading-note">Still working ({secs}s). On a slow connection, or if our free server was asleep, this can take up to a minute.</p>}
    </div>
  );
}
