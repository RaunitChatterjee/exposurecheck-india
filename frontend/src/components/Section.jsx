export default function Section({ title, intro, children }) {
  return (
    <section className="sec">
      <h2>{title}</h2>
      {intro && <p className="intro">{intro}</p>}
      {children}
    </section>
  );
}
