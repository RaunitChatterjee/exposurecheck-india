import Section from "./Section.jsx";

export default function Transparency({ stats }) {
  return (
    <Section title="How this works, and what we store">
      <dl className="how">
        <dt>Breaches</dt><dd>Your email is checked against a public breach database (HaveIBeenPwned or XposedOrNot; each report names its source). India-related breaches are listed first.</dd>
        <dt>Your domain</dt><dd>Optional. Uses public certificate logs (crt.sh) and DNS lookups for SPF, DKIM and DMARC.</dd>
        <dt>What we store</dt><dd>Only anonymous daily totals, such as the number of scans. Your email and domain are never saved or logged.</dd>
        <dt>What we skip</dt><dd>No signup, no email capture, no upsell. The code is open so you can check all of this.</dd>
      </dl>
      {stats && stats.total_scans > 0 && (
        <p className="fine">{stats.total_scans.toLocaleString("en-IN")} {stats.total_scans === 1 ? "scan" : "scans"} run so far, surfacing {stats.breaches_surfaced.toLocaleString("en-IN")} {stats.breaches_surfaced === 1 ? "breach" : "breaches"}.</p>
      )}
    </Section>
  );
}
