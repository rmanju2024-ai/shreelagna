function Lotus({ className }: { className: string }) {
  // unique id per instance to avoid SVG gradient collision in DOM
  const id = className.includes("left") ? "ll" : "lr";
  return (
    <svg className={className} viewBox="0 0 160 150" fill="none" aria-hidden>
      <defs>
        {/* lily pad */}
        <radialGradient id={`${id}-pad`} cx="50%" cy="30%">
          <stop offset="0%" stopColor="#88d468" />
          <stop offset="55%" stopColor="#3a9a32" />
          <stop offset="100%" stopColor="#1e6020" />
        </radialGradient>
        <radialGradient id={`${id}-pad-sh`} cx="50%" cy="60%">
          <stop offset="0%" stopColor="#1e6020" stopOpacity=".55" />
          <stop offset="100%" stopColor="#1e6020" stopOpacity="0" />
        </radialGradient>
        {/* outer petals */}
        <linearGradient id={`${id}-po`} x1="80" y1="18" x2="80" y2="108" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fff6f8" />
          <stop offset="35%" stopColor="#ffd0e0" />
          <stop offset="75%" stopColor="#f090b8" />
          <stop offset="100%" stopColor="#c05888" />
        </linearGradient>
        {/* mid petals */}
        <linearGradient id={`${id}-pm`} x1="80" y1="28" x2="80" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fff8fa" />
          <stop offset="40%" stopColor="#ffe0ec" />
          <stop offset="100%" stopColor="#e878b0" />
        </linearGradient>
        {/* inner petals — almost white with blush at tips */}
        <linearGradient id={`${id}-pi`} x1="80" y1="32" x2="80" y2="94" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fff" />
          <stop offset="55%" stopColor="#ffecf4" />
          <stop offset="100%" stopColor="#f0a8cc" />
        </linearGradient>
        {/* stamen — amber gold */}
        <radialGradient id={`${id}-st`} cx="40%" cy="35%">
          <stop offset="0%" stopColor="#fffbe0" />
          <stop offset="45%" stopColor="#ffd060" />
          <stop offset="100%" stopColor="#c47a22" />
        </radialGradient>
        {/* warm under-glow from water reflection */}
        <radialGradient id={`${id}-glow`} cx="50%" cy="85%">
          <stop offset="0%" stopColor="#fde8a0" stopOpacity=".55" />
          <stop offset="100%" stopColor="#fde8a0" stopOpacity="0" />
        </radialGradient>
        {/* ripple stroke */}
        <linearGradient id={`${id}-rip`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#a8d8d0" stopOpacity="0" />
          <stop offset="50%" stopColor="#a8d8d0" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#a8d8d0" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* warm under-glow ellipse */}
      <ellipse cx="80" cy="128" rx="52" ry="16" fill={`url(#${id}-glow)`} />

      {/* lily pad shadow */}
      <ellipse cx="80" cy="130" rx="46" ry="12" fill={`url(#${id}-pad-sh)`} />
      {/* lily pad */}
      <ellipse cx="80" cy="126" rx="42" ry="11" fill={`url(#${id}-pad)`} />
      {/* pad notch */}
      <path d="M80 115 L80 126" stroke="#2a7a28" strokeWidth="1.5" opacity=".5" />

      {/* outer petals — wide spread */}
      <path d="M80 108 C50 96 28 68 38 42 48 62 66 82 80 88 94 82 112 62 122 42 132 68 110 96 80 108Z"
        fill={`url(#${id}-po)`} />
      {/* outer side petals */}
      <path d="M80 108 C26 92 12 54 26 28 36 52 58 74 80 82Z"
        fill={`url(#${id}-po)`} opacity=".8" />
      <path d="M80 108 C134 92 148 54 134 28 124 52 102 74 80 82Z"
        fill={`url(#${id}-po)`} opacity=".8" />
      {/* petal vein highlights */}
      <path d="M80 108 C68 90 62 70 70 48" stroke="#fff" strokeWidth="0.7" opacity=".4" strokeLinecap="round"/>
      <path d="M80 108 C92 90 98 70 90 48" stroke="#fff" strokeWidth="0.7" opacity=".4" strokeLinecap="round"/>

      {/* mid petals */}
      <path d="M80 100 C60 88 52 64 60 44 66 60 74 78 80 84 86 78 94 60 100 44 108 64 100 88 80 100Z"
        fill={`url(#${id}-pm)`} />

      {/* inner petals — upright white */}
      <path d="M80 95 C66 80 64 56 72 38 74 56 78 74 80 82 82 74 86 56 88 38 96 56 94 80 80 95Z"
        fill={`url(#${id}-pi)`} />
      <path d="M80 92 C70 76 70 54 76 36 78 54 80 72 80 82 80 72 82 54 84 36 90 54 90 76 80 92Z"
        fill={`url(#${id}-pi)`} opacity=".85"/>

      {/* stamen cluster */}
      <circle cx="80" cy="70" r="10" fill={`url(#${id}-st)`} />
      <circle cx="80" cy="68" r="5" fill="#fff9e8" opacity=".9" />
      {/* stamen filaments */}
      <line x1="80" y1="60" x2="76" y2="52" stroke="#f5c060" strokeWidth="0.8" opacity=".7"/>
      <line x1="80" y1="60" x2="84" y2="52" stroke="#f5c060" strokeWidth="0.8" opacity=".7"/>
      <line x1="80" y1="60" x2="80" y2="50" stroke="#f5c060" strokeWidth="0.8" opacity=".7"/>

      {/* water ripples */}
      <ellipse cx="80" cy="128" rx="32" ry="4.5" fill="none"
        stroke={`url(#${id}-rip)`} strokeWidth="1.2" opacity=".6" />
      <ellipse cx="80" cy="130" rx="50" ry="7" fill="none"
        stroke={`url(#${id}-rip)`} strokeWidth=".8" opacity=".35" />
    </svg>
  );
}

function HeartGlow() {
  return (
    <svg className="lotus-lake-heart" viewBox="0 0 56 52" fill="none" aria-hidden>
      <defs>
        <radialGradient id="hg-fill" cx="45%" cy="30%">
          <stop offset="0%" stopColor="#fffbe0" />
          <stop offset="30%" stopColor="#ffe080" />
          <stop offset="65%" stopColor="#f0a030" />
          <stop offset="100%" stopColor="#a86020" />
        </radialGradient>
        <radialGradient id="hg-halo" cx="50%" cy="55%">
          <stop offset="0%" stopColor="#ffe880" stopOpacity=".75" />
          <stop offset="100%" stopColor="#ffa830" stopOpacity="0" />
        </radialGradient>
        <filter id="hg-blur" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="3.5" />
        </filter>
        <filter id="hg-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1.5" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
      {/* outer halo */}
      <path
        d="M28 48 C14 40 4 30 4 20 4 12 10 7 17 7 21 7 25 9.5 28 13.5 31 9.5 35 7 39 7 46 7 52 12 52 20 52 30 42 40 28 48Z"
        fill="url(#hg-halo)" filter="url(#hg-blur)"
      />
      {/* main heart */}
      <path
        d="M28 48 C14 40 4 30 4 20 4 12 10 7 17 7 21 7 25 9.5 28 13.5 31 9.5 35 7 39 7 46 7 52 12 52 20 52 30 42 40 28 48Z"
        fill="url(#hg-fill)" filter="url(#hg-glow)"
      />
      {/* specular shine */}
      <path d="M13 12 C16 9 21 9 24 11" stroke="#fff" strokeWidth="2" strokeLinecap="round" opacity=".7"/>
      {/* inner warm highlight */}
      <ellipse cx="28" cy="25" rx="7" ry="6" fill="#fff9d0" opacity=".3" />
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
