const FLOCK = [
  { id: "a", a: "#ff5d8f", b: "#ffb347", size: 2.4, dur: 34, delay: 2, top: 18 },
  { id: "b", a: "#7c5cff", b: "#4fd1c5", size: 1.8, dur: 44, delay: 12, top: 56 },
  { id: "c", a: "#f5c84c", b: "#ff7a59", size: 2.1, dur: 38, delay: 22, top: 36 },
];

/** Decorative butterflies drifting across every page. Pure CSS, no JS, off for reduced motion. */
export function Butterflies() {
  return (
    <div className="bf-sky" aria-hidden>
      {FLOCK.map((fly) => (
        <span
          key={fly.id}
          className="bf-fly"
          style={
            {
              "--bf-size": `${fly.size}rem`,
              "--bf-dur": `${fly.dur}s`,
              "--bf-delay": `${fly.delay}s`,
              "--bf-top": `${fly.top}vh`,
            } as React.CSSProperties
          }
        >
          <svg viewBox="0 0 64 48" className="bf-svg">
            <g className="bf-wing bf-left">
              <path d="M32 24 C18 2 2 6 6 22 C8 32 20 34 32 26 Z" fill={fly.a} />
              <path d="M32 26 C20 30 10 40 18 44 C26 46 32 36 32 26 Z" fill={fly.b} />
              <circle cx="14" cy="16" r="3" fill="#fff8e7" opacity="0.65" />
            </g>
            <g className="bf-wing bf-right">
              <path d="M32 24 C46 2 62 6 58 22 C56 32 44 34 32 26 Z" fill={fly.a} />
              <path d="M32 26 C44 30 54 40 46 44 C38 46 32 36 32 26 Z" fill={fly.b} />
              <circle cx="50" cy="16" r="3" fill="#fff8e7" opacity="0.65" />
            </g>
            <rect x="30.8" y="14" width="2.4" height="24" rx="1.2" fill="#3f0e0d" />
            <path d="M32 15 C30 8 26 6 24 6 M32 15 C34 8 38 6 40 6" stroke="#3f0e0d" strokeWidth="1" fill="none" />
          </svg>
        </span>
      ))}
    </div>
  );
}
