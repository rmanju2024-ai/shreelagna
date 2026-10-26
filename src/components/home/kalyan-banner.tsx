"use client";

/* Natural sunrise lake — reference: warm peach sky, rolling hills, temple, birds, lotus */

function Lotus({ side }: { side: "l" | "r" }) {
  const id = side;
  return (
    <svg viewBox="0 0 180 170" fill="none" aria-hidden>
      <defs>
        <radialGradient id={`lp-pad-${id}`} cx="50%" cy="35%">
          <stop offset="0%" stopColor="#98d870" />
          <stop offset="55%" stopColor="#5ab840" />
          <stop offset="100%" stopColor="#2e8020" />
        </radialGradient>
        <radialGradient id={`lp-ps-${id}`} cx="50%" cy="60%">
          <stop offset="0%" stopColor="#228020" stopOpacity=".45" />
          <stop offset="100%" stopColor="#228020" stopOpacity="0" />
        </radialGradient>
        {/* Outer petals — vibrant rose-pink */}
        <linearGradient id={`lp-o-${id}`} x1="90" y1="15" x2="90" y2="120" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#f8c8d8" />
          <stop offset="40%" stopColor="#f090a8" />
          <stop offset="85%" stopColor="#e05880" />
          <stop offset="100%" stopColor="#c04060" />
        </linearGradient>
        {/* Mid petals */}
        <linearGradient id={`lp-m-${id}`} x1="90" y1="30" x2="90" y2="112" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fff0f4" />
          <stop offset="35%" stopColor="#f8c0d0" />
          <stop offset="100%" stopColor="#e87098" />
        </linearGradient>
        {/* Inner petals — soft blush */}
        <linearGradient id={`lp-i-${id}`} x1="90" y1="40" x2="90" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fff" />
          <stop offset="60%" stopColor="#ffe8f0" />
          <stop offset="100%" stopColor="#f0b0c8" />
        </linearGradient>
        {/* Stamen */}
        <radialGradient id={`lp-st-${id}`} cx="42%" cy="32%">
          <stop offset="0%" stopColor="#fff8c0" />
          <stop offset="45%" stopColor="#f0d040" />
          <stop offset="100%" stopColor="#c89020" />
        </radialGradient>
        {/* Water glow under pad */}
        <radialGradient id={`lp-gw-${id}`} cx="50%" cy="80%">
          <stop offset="0%" stopColor="#c8f0e8" stopOpacity=".7" />
          <stop offset="100%" stopColor="#c8f0e8" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* water-glow beneath */}
      <ellipse cx="90" cy="146" rx="62" ry="16" fill={`url(#lp-gw-${id})`} />
      {/* pad shadow */}
      <ellipse cx="90" cy="144" rx="52" ry="13" fill={`url(#lp-ps-${id})`} />
      {/* lily pad */}
      <ellipse cx="90" cy="140" rx="50" ry="13" fill={`url(#lp-pad-${id})`} />
      {/* pad notch */}
      <path d="M90 127 L90 140" stroke="#2e8020" strokeWidth="1.5" opacity=".5" />

      {/* === Outer petals (6 petals, splayed wide) === */}
      {/* back left */}
      <path d="M90 118 C64 108 44 78 52 48 58 68 74 92 90 100Z" fill={`url(#lp-o-${id})`} opacity=".85" />
      {/* back right */}
      <path d="M90 118 C116 108 136 78 128 48 122 68 106 92 90 100Z" fill={`url(#lp-o-${id})`} opacity=".85" />
      {/* far left */}
      <path d="M90 118 C48 106 24 72 34 38 44 62 68 88 90 96Z" fill={`url(#lp-o-${id})`} opacity=".75" />
      {/* far right */}
      <path d="M90 118 C132 106 156 72 146 38 136 62 112 88 90 96Z" fill={`url(#lp-o-${id})`} opacity=".75" />
      {/* front-left outer */}
      <path d="M90 118 C64 108 50 88 56 62 64 80 76 96 90 104Z" fill={`url(#lp-o-${id})`} />
      {/* front-right outer */}
      <path d="M90 118 C116 108 130 88 124 62 116 80 104 96 90 104Z" fill={`url(#lp-o-${id})`} />

      {/* petal veins */}
      <path d="M90 118 C82 100 78 82 82 62" stroke="rgba(255,255,255,0.35)" strokeWidth=".8" strokeLinecap="round"/>
      <path d="M90 118 C98 100 102 82 98 62" stroke="rgba(255,255,255,0.35)" strokeWidth=".8" strokeLinecap="round"/>

      {/* === Mid petals === */}
      <path d="M90 110 C70 98 64 74 72 52 76 70 84 88 90 96Z" fill={`url(#lp-m-${id})`} />
      <path d="M90 110 C110 98 116 74 108 52 104 70 96 88 90 96Z" fill={`url(#lp-m-${id})`} />
      <path d="M90 110 C76 96 72 72 80 48 82 66 86 84 90 92Z" fill={`url(#lp-m-${id})`} />
      <path d="M90 110 C104 96 108 72 100 48 98 66 94 84 90 92Z" fill={`url(#lp-m-${id})`} />

      {/* === Inner petals === */}
      <path d="M90 104 C76 90 74 68 82 44 84 62 88 80 90 88Z" fill={`url(#lp-i-${id})`} />
      <path d="M90 104 C104 90 106 68 98 44 96 62 92 80 90 88Z" fill={`url(#lp-i-${id})`} />
      <path d="M90 102 C80 86 80 64 88 42 88 60 90 78 90 86Z" fill={`url(#lp-i-${id})`} />

      {/* stamen */}
      <circle cx="90" cy="76" r="12" fill={`url(#lp-st-${id})`} />
      <circle cx="90" cy="74" r="6"  fill="#fffce0" opacity=".95" />
      <circle cx="88" cy="72" r="2.5" fill="#fff" opacity=".7" />

      {/* water ripples around pad */}
      <ellipse cx="90" cy="142" rx="38" ry="5.5" fill="none" stroke="rgba(80,200,190,0.45)" strokeWidth="1.2" />
      <ellipse cx="90" cy="144" rx="56" ry="8"   fill="none" stroke="rgba(80,200,190,0.25)" strokeWidth=".8" />
    </svg>
  );
}

/* Small bird (seagull silhouette) */
function Bird({ className }: { className: string }) {
  return (
    <svg className={className} viewBox="0 0 32 14" fill="none" aria-hidden>
      <path d="M0 9 Q8 1 16 7 Q24 1 32 9"
        stroke="#c47870" strokeWidth="2" strokeLinecap="round" fill="none" />
    </svg>
  );
}

/* Heart — gold stroke outline (as in reference) */
function HeartOutline() {
  return (
    <svg className="lotus-lake-heart" viewBox="0 0 60 56" fill="none" aria-hidden>
      <defs>
        <linearGradient id="hrt-stroke" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fde870" />
          <stop offset="50%" stopColor="#f0a830" />
          <stop offset="100%" stopColor="#fde870" />
        </linearGradient>
        <filter id="hrt-glow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="2.5" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
      <path
        d="M30 50 C16 42 4 32 4 20 4 12 10 6 18 6 22 6 26 9 30 14 34 9 38 6 42 6 50 6 56 12 56 20 56 32 44 42 30 50Z"
        stroke="url(#hrt-stroke)" strokeWidth="2.8" strokeLinejoin="round"
        fill="rgba(253,232,120,0.12)" filter="url(#hrt-glow)"
      />
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
      {/* Sky layers */}
      <div className="lotus-lake-sky" />
      {/* Sun with rays */}
      <div className="lotus-lake-sunrays" />
      <div className="lotus-lake-sun" />
      {/* Landscape */}
      <div className="lotus-lake-hill is-far" />
      <div className="lotus-lake-hill is-mid" />
      <div className="lotus-lake-hill is-near" />
      <div className="lotus-lake-temple" />
      {/* Birds in sky */}
      <Bird className="lotus-lake-bird is-1" />
      <Bird className="lotus-lake-bird is-2" />
      <Bird className="lotus-lake-bird is-3" />
      <Bird className="lotus-lake-bird is-4" />
      {/* Water */}
      <div className="lotus-lake-water" />
      <div className="lotus-lake-water-shimmer" />
      <div className="lotus-lake-water-waves" />
      {/* Lotus flowers */}
      <div className="lotus-lake-flower is-left">
        <Lotus side="l" />
      </div>
      <div className="lotus-lake-flower is-right">
        <Lotus side="r" />
      </div>
      {/* Heart outline */}
      <HeartOutline />
      {/* Water sparkle dots */}
      <span className="lotus-lake-spark is-1" />
      <span className="lotus-lake-spark is-2" />
      <span className="lotus-lake-spark is-3" />
      <span className="lotus-lake-spark is-4" />
      {/* Falling petals */}
      <span className="lotus-lake-petal is-1" />
      <span className="lotus-lake-petal is-2" />
      <span className="lotus-lake-petal is-3" />
      <span className="lotus-lake-petal is-4" />
      {hero && veil ? <div className="lotus-lake-veil" /> : null}
    </div>
  );
}
