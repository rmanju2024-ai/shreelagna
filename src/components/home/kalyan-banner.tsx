function Lotus({ className }: { className: string }) {
  return (
    <svg className={className} viewBox="0 0 140 130" fill="none" aria-hidden>
      {/* pad / leaf */}
      <ellipse cx="70" cy="114" rx="42" ry="11" fill="url(#lpad-s)" />
      <ellipse cx="70" cy="110" rx="38" ry="9" fill="url(#lpad)" />
      {/* petals — outer ring */}
      <path d="M70 95 C46 85 34 58 42 36 50 52 62 68 70 72 78 68 90 52 98 36 106 58 94 85 70 95Z" fill="url(#lpOuter)" />
      <path d="M70 95 C26 80 18 46 34 22 40 46 58 66 70 72 82 66 100 46 106 22 122 46 114 80 70 95Z" fill="url(#lpOuter2)" opacity=".7"/>
      {/* petals — inner ring */}
      <path d="M70 90 C52 78 48 52 58 36 62 52 68 68 70 72 72 68 78 52 82 36 92 52 88 78 70 90Z" fill="url(#lpInner)" />
      <path d="M70 88 C58 74 56 50 64 32 66 50 70 68 70 72 70 68 74 50 76 32 84 50 82 74 70 88Z" fill="url(#lpCenter)" />
      {/* stamens */}
      <circle cx="70" cy="64" r="8" fill="url(#lstamen)" />
      <circle cx="70" cy="63" r="4" fill="#fff9e0" opacity=".9" />
      {/* water ripple */}
      <ellipse cx="70" cy="112" rx="30" ry="4" fill="none" stroke="url(#lripple)" strokeWidth="1" opacity=".5" />
      <ellipse cx="70" cy="112" rx="44" ry="6" fill="none" stroke="url(#lripple)" strokeWidth=".7" opacity=".3" />
      <defs>
        <radialGradient id="lpad" cx="50%" cy="30%">
          <stop offset="0%" stopColor="#6dbf5e" />
          <stop offset="100%" stopColor="#2e7d32" />
        </radialGradient>
        <radialGradient id="lpad-s" cx="50%" cy="50%">
          <stop offset="0%" stopColor="#1b5e20" stopOpacity=".5" />
          <stop offset="100%" stopColor="#1b5e20" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="lpOuter" x1="70" y1="22" x2="70" y2="96" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#f8b4d0" />
          <stop offset="60%" stopColor="#e8709e" />
          <stop offset="100%" stopColor="#c2457a" />
        </linearGradient>
        <linearGradient id="lpOuter2" x1="70" y1="22" x2="70" y2="96" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fce4ef" />
          <stop offset="100%" stopColor="#e8709e" />
        </linearGradient>
        <linearGradient id="lpInner" x1="70" y1="32" x2="70" y2="92" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fde8f2" />
          <stop offset="100%" stopColor="#e8709e" />
        </linearGradient>
        <linearGradient id="lpCenter" x1="70" y1="28" x2="70" y2="90" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fff0f8" />
          <stop offset="100%" stopColor="#f4a7c8" />
        </linearGradient>
        <radialGradient id="lstamen" cx="40%" cy="35%">
          <stop offset="0%" stopColor="#fff3a0" />
          <stop offset="50%" stopColor="#f3c56a" />
          <stop offset="100%" stopColor="#c47a22" />
        </radialGradient>
        <linearGradient id="lripple" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#7fc8c8" stopOpacity="0" />
          <stop offset="50%" stopColor="#7fc8c8" stopOpacity="1" />
          <stop offset="100%" stopColor="#7fc8c8" stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function HeartGlow() {
  return (
    <svg className="lotus-lake-heart" viewBox="0 0 48 44" fill="none" aria-hidden>
      <defs>
        <radialGradient id="hglow" cx="50%" cy="60%">
          <stop offset="0%" stopColor="#fff8d0" />
          <stop offset="40%" stopColor="#f3c56a" />
          <stop offset="100%" stopColor="#c47a22" />
        </radialGradient>
        <filter id="hblur">
          <feGaussianBlur stdDeviation="2" />
        </filter>
      </defs>
      {/* glow halo */}
      <path
        d="M24 40S4 28 4 16c0-6.6 5.4-11 11-11 3.6 0 6.6 2 9 5.2C26.4 7 29.4 5 33 5c5.6 0 11 4.4 11 11 0 12-20 24-20 24Z"
        fill="#f3c56a" filter="url(#hblur)" opacity=".6"
      />
      {/* main heart */}
      <path
        d="M24 40S4 28 4 16c0-6.6 5.4-11 11-11 3.6 0 6.6 2 9 5.2C26.4 7 29.4 5 33 5c5.6 0 11 4.4 11 11 0 12-20 24-20 24Z"
        fill="url(#hglow)"
      />
      {/* specular */}
      <path d="M14 10c2-2 5-3 8-2.5" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" opacity=".6" />
    </svg>
  );
}

export function KalyanBanner({
  intensity = "hero",
  veil = true,
}: {
  intensity?: "hero" | "wash";
  presentation?: "cover" | "complete";
  veil?: boolean;
}) {
  const hero = intensity === "hero";
  return (
    <div className={`lotus-lake${hero ? " is-hero" : " is-wash"}`} aria-hidden>
      <div className="lotus-lake-sky" />
      <div className="lotus-lake-horizon" />
      <span className="lotus-lake-sun" />
      <span className="lotus-lake-sunhalo" />
      <span className="lotus-lake-ray" />
      <span className="lotus-lake-hill is-far" />
      <span className="lotus-lake-hill is-near" />
      <span className="lotus-lake-tree is-l" />
      <span className="lotus-lake-tree is-r" />
      <div className="lotus-lake-water" />
      <div className="lotus-lake-shimmer" />
      <div className="lotus-lake-shimmer is-b" />
      <Lotus className="lotus-lake-flower is-left" />
      <Lotus className="lotus-lake-flower is-right" />
      <HeartGlow />
      <span className="lotus-lake-sparkle is-1" />
      <span className="lotus-lake-sparkle is-2" />
      <span className="lotus-lake-sparkle is-3" />
      <span className="lotus-lake-petal is-1" />
      <span className="lotus-lake-petal is-2" />
      <span className="lotus-lake-petal is-3" />
      <span className="lotus-lake-petal is-4" />
      {hero && veil ? <div className="lotus-lake-veil" /> : null}
    </div>
  );
}
