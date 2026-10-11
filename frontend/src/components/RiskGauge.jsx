const BANDS = [
  { name: "Low", from: 0, to: 20 },
  { name: "Moderate", from: 20, to: 45 },
  { name: "High", from: 45, to: 70 },
  { name: "Critical", from: 70, to: 100 },
];

export default function RiskGauge({ risk }) {
  return (
    <figure className="score" aria-label={`Risk score ${risk.score} out of 100, ${risk.level}`}>
      <div className="score-num">
        <span className={`score-value lvl-${risk.level}`}>{risk.score}</span>
        <span className="score-of">of 100</span>
      </div>
      <div className="meter" aria-hidden="true">
        {BANDS.map((b) => (
          <span key={b.name} className={`band ${b.name === risk.level ? `band-on lvl-bg-${b.name}` : ""}`} style={{ flexGrow: b.to - b.from }} />
        ))}
        <span className="pin" style={{ left: `${Math.min(99, Math.max(1, risk.score))}%` }} />
      </div>
      <figcaption className={`score-level lvl-${risk.level}`}>{risk.level} risk</figcaption>
    </figure>
  );
}
