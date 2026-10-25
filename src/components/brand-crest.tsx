import { useId } from "react";

export function BrandCrest() {
  const uid = useId().replace(/:/g, "");
  const g = (name: string) => `${name}-${uid}`;

  return (
    <span className="brand-crest" aria-hidden>
      <svg viewBox="0 0 88 88">
        <defs>
          <radialGradient id={g("halo")} cx="50%" cy="55%" r="55%">
            <stop offset="0%" stopColor="#ffe9b0" />
            <stop offset="62%" stopColor="#ffe9b0" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#ffe9b0" stopOpacity="0" />
          </radialGradient>
          <linearGradient id={g("leafL")} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#d4f07a" />
            <stop offset="40%" stopColor="#73c04a" />
            <stop offset="100%" stopColor="#2f7a22" />
          </linearGradient>
          <linearGradient id={g("leafR")} x1="1" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#e3f88c" />
            <stop offset="45%" stopColor="#7dcc4e" />
            <stop offset="100%" stopColor="#2c741e" />
          </linearGradient>
          <linearGradient id={g("petal")} x1="0.3" y1="0" x2="0.7" y2="1">
            <stop offset="0%" stopColor="#ffe1f2" />
            <stop offset="35%" stopColor="#ff8ec3" />
            <stop offset="100%" stopColor="#e24b93" />
          </linearGradient>
          <linearGradient id={g("birdL")} x1="0.2" y1="0" x2="0.9" y2="1">
            <stop offset="0%" stopColor="#d36a6c" />
            <stop offset="48%" stopColor="#9a2a36" />
            <stop offset="100%" stopColor="#5c121c" />
          </linearGradient>
          <linearGradient id={g("birdR")} x1="0.15" y1="0" x2="0.9" y2="1">
            <stop offset="0%" stopColor="#ffe08a" />
            <stop offset="50%" stopColor="#e0a338" />
            <stop offset="100%" stopColor="#a56a12" />
          </linearGradient>
        </defs>

        <ellipse cx="44" cy="46" rx="34" ry="34" fill={`url(#${g("halo")})`} />

        <path d="M8 62c14-6 22-22 26-34 2 12 0 26-10 36-8 8-18 8-22 4 3-1 5-3 6-6z" fill={`url(#${g("leafL")})`} />
        <path d="M80 62c-14-6-22-22-26-34-2 12 0 26 10 36 8 8 18 8 22 4-3-1-5-3-6-6z" fill={`url(#${g("leafR")})`} />
        <path d="M18 70c8-18 18-28 26-32 8 4 18 14 26 32-18 10-34 10-52 0z" fill={`url(#${g("petal")})`} />
        <path d="M28 72c6-10 12-14 16-16 4 2 10 6 16 16-10 5-22 5-32 0z" fill="#ffd0e8" opacity="0.55" />
        <circle cx="32" cy="66" r="2" fill="#fff" opacity="0.9" />
        <circle cx="56" cy="64" r="1.6" fill="#fff" opacity="0.85" />

        <path
          d="M42.8 58C26 56 16 44 16 32.5 16 23.2 24 16 33.8 16c5.4 0 9.4 3.2 12.2 8.4C42 32 41.4 44 41.6 50c-2.8 3.6-6.8 6.4-10.8 8z"
          fill={`url(#${g("birdL")})`}
        />
        <path
          d="M45.2 58C62 56 72 44 72 32.5 72 23.2 64 16 54.2 16c-5.4 0-9.4 3.2-12.2 8.4C46 32 46.6 44 46.4 50c2.8 3.6 6.8 6.4 10.8 8z"
          fill={`url(#${g("birdR")})`}
        />
        <ellipse cx="31" cy="24" rx="6" ry="3.2" fill="#fff" opacity="0.28" />
        <ellipse cx="57" cy="24" rx="6" ry="3.2" fill="#fff" opacity="0.34" />
        <circle cx="31.5" cy="31.5" r="3.1" fill="#fff" />
        <circle cx="32.2" cy="31.8" r="1.7" fill="#1a100c" />
        <circle cx="56.5" cy="31.5" r="3.1" fill="#fff" />
        <circle cx="55.8" cy="31.8" r="1.7" fill="#1a100c" />
        <path d="M41.6 36.5c1.2-2.6 3.6-2.6 4.8 0 .7 1.5-.4 3-2.4 3.7-2-.7-3.1-2.2-2.4-3.7z" fill="#f6c85c" />
      </svg>
    </span>
  );
}
