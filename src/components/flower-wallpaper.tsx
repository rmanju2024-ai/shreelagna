const BLOOMS = [
  { x: "6%", y: "12%", s: 1.05, d: "0s", k: "lotus" },
  { x: "88%", y: "8%", s: 0.9, d: "2.4s", k: "marigold" },
  { x: "78%", y: "72%", s: 1.2, d: "1.1s", k: "lotus" },
  { x: "8%", y: "68%", s: 0.85, d: "3.2s", k: "jasmine" },
  { x: "48%", y: "86%", s: 0.7, d: "4s", k: "marigold" },
  { x: "92%", y: "42%", s: 0.75, d: "1.8s", k: "jasmine" },
  { x: "18%", y: "38%", s: 0.62, d: "5s", k: "lotus" },
  { x: "62%", y: "18%", s: 0.68, d: "2.8s", k: "jasmine" },
] as const;

function Lotus() {
  return (
    <svg viewBox="0 0 80 80" aria-hidden>
      <g fill="none" stroke="currentColor" strokeWidth="1.4">
        <path d="M40 10c2.2 10 14 14 14 30S42.2 64 40 70C37.8 64 26 60 26 40S37.8 20 40 10Z" />
        <path d="M14 40c10-2.2 14-14 26-14s16 11.8 26 14c-10 2.2-14 14-26 14S24 42.2 14 40Z" />
        <path d="M20 22c9 6 14 16 20 18 6-2 11-12 20-18-7 10-10 22-20 28-10-6-13-18-20-28Z" />
        <path d="M20 58c9-6 14-16 20-18 6 2 11 12 20 18-7-10-10-22-20-28-10 6-13 18-20 28Z" />
        <circle cx="40" cy="40" r="5.5" fill="currentColor" stroke="none" />
      </g>
    </svg>
  );
}

function Marigold() {
  return (
    <svg viewBox="0 0 80 80" aria-hidden>
      <g fill="currentColor">
        {Array.from({ length: 12 }, (_, i) => (
          <ellipse key={i} cx="40" cy="22" rx="6.5" ry="16" transform={`rotate(${i * 30} 40 40)`} opacity="0.85" />
        ))}
        <circle cx="40" cy="40" r="8" />
      </g>
    </svg>
  );
}

function Jasmine() {
  return (
    <svg viewBox="0 0 80 80" aria-hidden>
      <g fill="currentColor">
        {Array.from({ length: 6 }, (_, i) => (
          <ellipse key={i} cx="40" cy="24" rx="7" ry="18" transform={`rotate(${i * 60} 40 40)`} opacity="0.8" />
        ))}
        <circle cx="40" cy="40" r="6.5" />
      </g>
    </svg>
  );
}

export function FlowerWallpaper() {
  return (
    <div className="flower-wall" aria-hidden>
      <div className="flower-wall-pattern" />
      {BLOOMS.map((bloom, index) => (
        <span
          key={index}
          className={`flower-bloom is-${bloom.k}`}
          style={{ left: bloom.x, top: bloom.y, animationDelay: bloom.d, ["--s" as string]: String(bloom.s) }}
        >
          {bloom.k === "lotus" ? <Lotus /> : bloom.k === "marigold" ? <Marigold /> : <Jasmine />}
        </span>
      ))}
    </div>
  );
}
