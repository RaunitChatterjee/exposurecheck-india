export default function ToolShell({ title, intro, privacy, children }) {
  return (
    <section className="tool">
      <div className="tool-head">
        <h1>{title}</h1>
        <p>{intro}</p>
      </div>
      {children}
      <p className="fine tool-privacy">{privacy}</p>
    </section>
  );
}
