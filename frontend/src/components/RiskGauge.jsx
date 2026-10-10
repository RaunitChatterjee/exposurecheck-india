const COLORS = { Low: "var(--ok)", Moderate: "var(--warn)", High: "var(--high)", Critical: "var(--crit)" };

export default function RiskGauge({ risk }) {
  const r = 52, c = 2 * Math.PI * r, color = COLORS[risk.level];
  return (
    <figure className="gauge" aria-label={`Risk score ${risk.score} out of 100, ${risk.level}`}>
      <svg viewBox="0 0 120 120" width="132" height="132" role="img">
        <circle cx="60" cy="60" r={r} fill="none" stroke="var(--line)" strokeWidth="10" />
        <circle cx="60" cy="60" r={r} fill="none" stroke={color} strokeWidth="10" strokeLinecap="round"
                strokeDasharray={`${(risk.score / 100) * c} ${c}`} transform="rotate(-90 60 60)" />
        <text x="60" y="60" textAnchor="middle" fontSize="30" fontWeight="700" fill="var(--text)">{risk.score}</text>
        <text x="60" y="80" textAnchor="middle" fontSize="11" fill="var(--muted)">out of 100</text>
      </svg>
      <figcaption style={{ color }}>{risk.level} risk</figcaption>
    </figure>
  );
}
