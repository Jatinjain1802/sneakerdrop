export default function Marquee() {
  const words = ['Limited runs', 'Waitlists open', 'No restocks', 'Small batch', 'Built to move', 'Drop 04'];
  const row = [...words, ...words];
  return (
    <div className="marquee" aria-hidden="true">
      <div className="marquee-track">
        {row.concat(row).map((w, i) => (
          <span key={i}>{w}<b>✦</b></span>
        ))}
      </div>
    </div>
  );
}
