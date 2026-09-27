const PETALS = Array.from({ length: 24 }, (_, i) => ({
  left: `${4 + ((i * 13) % 92)}%`,
  delay: `${(i * 0.55) % 14}s`,
  duration: `${14 + (i % 9)}s`,
  size: `${0.55 + (i % 6) * 0.14}rem`,
  sway: `${8 + (i % 7) * 4}px`,
  kind: i % 3 === 0 ? "gold" : i % 3 === 1 ? "maroon" : "ivory",
}));

function Mandala({ className }: { className: string }) {
  return (
    <svg className={className} viewBox="0 0 120 120" aria-hidden>
      <g fill="none" stroke="currentColor" strokeWidth="1.1">
        <circle cx="60" cy="60" r="18" />
        <circle cx="60" cy="60" r="32" />
        <circle cx="60" cy="60" r="46" />
        {Array.from({ length: 12 }, (_, i) => (
          <ellipse key={i} cx="60" cy="22" rx="7" ry="16" transform={`rotate(${i * 30} 60 60)`} />
        ))}
        <circle cx="60" cy="60" r="6" fill="currentColor" stroke="none" />
      </g>
    </svg>
  );
}

export function WeddingScreensaver() {
  return (
    <div className="wedding-saver" aria-hidden>
      <div className="wedding-saver-wash" />
      <div className="wedding-saver-toran">
        {Array.from({ length: 18 }, (_, i) => (
          <span key={i} className="wedding-saver-drape" style={{ animationDelay: `${i * 0.12}s` }} />
        ))}
      </div>
      <Mandala className="wedding-saver-mandala is-left" />
      <Mandala className="wedding-saver-mandala is-right" />
      <span className="wedding-saver-diya is-left" />
      <span className="wedding-saver-diya is-right" />
      {PETALS.map((petal, i) => (
        <span
          key={i}
          className={`wedding-saver-petal is-${petal.kind}`}
          style={{
            left: petal.left,
            animationDelay: petal.delay,
            animationDuration: petal.duration,
            width: petal.size,
            height: `calc(${petal.size} * 1.5)`,
            ["--sway" as string]: petal.sway,
          }}
        />
      ))}
    </div>
  );
}
