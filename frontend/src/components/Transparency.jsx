export default function Transparency({ stats }) {
  return (
    <section className="card transparency">
      <h2>How this works, and what we store</h2>
      <ul>
        <li><b>Breaches:</b> your email is checked against the HaveIBeenPwned API, with India-related breaches highlighted.</li>
        <li><b>Domain (optional):</b> public certificate transparency logs (crt.sh) and DNS lookups for SPF, DKIM and DMARC.</li>
        <li><b>Stored:</b> only anonymous daily totals (number of scans, breaches found). Your email and domain are never saved or logged.</li>
        <li><b>No signup, no upsell, no email capture.</b> The source code is open so you can verify all of this.</li>
      </ul>
      {stats && stats.total_scans > 0 && (
        <p className="muted small">Scans run so far: <b>{stats.total_scans.toLocaleString("en-IN")}</b> · Breaches surfaced: <b>{stats.breaches_surfaced.toLocaleString("en-IN")}</b></p>
      )}
    </section>
  );
}
