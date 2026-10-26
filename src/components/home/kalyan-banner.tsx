"use client";

/**
 * KalyanBanner — natural sunrise lake scene
 * Sky: warm peach → rolling hills → temple → birds → teal lake → lotus
 */

/* ── Lotus bloom ─────────────────────────────────────────────── */
function Lotus({ side }: { side: "l" | "r" }) {
  const p = side; // gradient ID prefix (keeps left/right isolated)
  // Petal angles for each ring
  const outerA = [0, 45, 90, 135, 180, 225, 270, 315];
  const midA   = [22.5, 67.5, 112.5, 157.5, 202.5, 247.5, 292.5, 337.5];
  const innerA = [0, 72, 144, 216, 288];

  return (
    <svg viewBox="0 0 200 210" fill="none" aria-hidden>
      <defs>
        {/* Lily pad */}
        <radialGradient id={`${p}pad`} cx="38%" cy="32%">
          <stop offset="0%" stopColor="#b8e880" />
          <stop offset="52%" stopColor="#58c038" />
          <stop offset="100%" stopColor="#2a7c18" />
        </radialGradient>
        {/* Outer petals — rich rose-pink, lighter at centre */}
        <radialGradient id={`${p}op`} cx="50%" cy="48%">
          <stop offset="0%"   stopColor="#fde4ef" />
          <stop offset="40%"  stopColor="#f290b2" />
          <stop offset="85%"  stopColor="#d85880" />
          <stop offset="100%" stopColor="#c04870" />
        </radialGradient>
        {/* Middle petals — softer rose */}
        <radialGradient id={`${p}mp`} cx="50%" cy="48%">
          <stop offset="0%"   stopColor="#fff4f8" />
          <stop offset="38%"  stopColor="#f8b8d0" />
          <stop offset="100%" stopColor="#e07098" />
        </radialGradient>
        {/* Inner petals — blush-white */}
        <radialGradient id={`${p}ip`} cx="50%" cy="48%">
          <stop offset="0%"   stopColor="#ffffff" />
          <stop offset="30%"  stopColor="#fce8f2" />
          <stop offset="100%" stopColor="#f0a8c4" />
        </radialGradient>
        {/* Stamen disc */}
        <radialGradient id={`${p}st`} cx="40%" cy="32%">
          <stop offset="0%"   stopColor="#fffde0" />
          <stop offset="42%"  stopColor="#f5d040" />
          <stop offset="100%" stopColor="#c08820" />
        </radialGradient>
        {/* Water glow */}
        <radialGradient id={`${p}gw`} cx="50%" cy="60%">
          <stop offset="0%"   stopColor="#c0f0e0" stopOpacity=".65" />
          <stop offset="100%" stopColor="#c0f0e0" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Water glow pool below pad */}
      <ellipse cx="100" cy="168" rx="62" ry="17" fill={`url(#${p}gw)`} />
      {/* Pad shadow */}
      <ellipse cx="100" cy="163" rx="53" ry="12" fill="#1e6018" opacity=".22" />
      {/* Lily pad */}
      <ellipse cx="100" cy="160" rx="53" ry="13" fill={`url(#${p}pad)`} />
      {/* Pad notch */}
      <path d="M100 147 L100 160" stroke="#2a7c18" strokeWidth="1.6" strokeLinecap="round" opacity=".45" />
      {/* Ripple rings */}
      <ellipse cx="100" cy="162" rx="42" ry="5.5" fill="none" stroke="rgba(60,190,170,.45)" strokeWidth="1.2" />
      <ellipse cx="100" cy="165" rx="63" ry="9"   fill="none" stroke="rgba(60,190,170,.20)" strokeWidth=".8"  />

      {/* ── Outer ring — 8 petals, 45° apart ── */}
      {outerA.map(a => (
        <g key={a} transform={`rotate(${a}, 100, 100)`}>
          <ellipse cx="100" cy="65" rx="15" ry="38" fill={`url(#${p}op)`} />
        </g>
      ))}

      {/* ── Middle ring — 8 petals, offset 22.5° ── */}
      {midA.map(a => (
        <g key={a} transform={`rotate(${a}, 100, 100)`}>
          <ellipse cx="100" cy="77" rx="10.5" ry="26" fill={`url(#${p}mp)`} />
        </g>
      ))}

      {/* ── Inner ring — 5 upright petals ── */}
      {innerA.map(a => (
        <g key={a} transform={`rotate(${a}, 100, 100)`}>
          <ellipse cx="100" cy="88" rx="7" ry="15" fill={`url(#${p}ip)`} />
        </g>
      ))}

      {/* Stamen disc */}
      <circle cx="100" cy="100" r="14"   fill={`url(#${p}st)`} />
      <circle cx="100" cy="98"  r="7"    fill="#fffde8" opacity=".95" />
      {/* Stamen tip highlight */}
      <circle cx="97"  cy="95"  r="2.8"  fill="#fff"    opacity=".65" />
    </svg>
  );
}

/* ── Bird (seagull silhouette) ──────────────────────────────── */
function Bird({ className }: { className: string }) {
  return (
    <svg className={className} viewBox="0 0 40 18" fill="none" aria-hidden>
      {/* Left wing arc */}
      <path d="M2 12 Q10 2 20 9" stroke="#b87870" strokeWidth="2.2" strokeLinecap="round" fill="none" />
      {/* Right wing arc */}
      <path d="M20 9 Q30 2 38 12" stroke="#b87870" strokeWidth="2.2" strokeLinecap="round" fill="none" />
    </svg>
  );
}

/* ── Gold outline heart (as in reference) ───────────────────── */
function HeartOutline() {
  return (
    <svg className="lotus-lake-heart" viewBox="0 0 60 56" fill="none" aria-hidden>
      <defs>
        <linearGradient id="hrt-g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="#fde870" />
          <stop offset="50%"  stopColor="#f0a030" />
          <stop offset="100%" stopColor="#fde870" />
        </linearGradient>
        <filter id="hrt-f" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="3" />
        </filter>
      </defs>
      {/* Outer glow */}
      <path d="M30 50C16 42 4 31 4 19 4 11 10 6 18 6c4 0 8 2.5 12 7 4-4.5 8-7 12-7 8 0 14 5 14 13 0 12-12 23-26 31Z"
        stroke="#f0a030" strokeWidth="6" strokeLinejoin="round" fill="none" filter="url(#hrt-f)" opacity=".6" />
      {/* Main outline */}
      <path d="M30 50C16 42 4 31 4 19 4 11 10 6 18 6c4 0 8 2.5 12 7 4-4.5 8-7 12-7 8 0 14 5 14 13 0 12-12 23-26 31Z"
        stroke="url(#hrt-g)" strokeWidth="2.5" strokeLinejoin="round"
        fill="rgba(253,232,120,0.10)"
      />
    </svg>
  );
}

/* ── Main banner ────────────────────────────────────────────── */
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

      {/* Sky */}
      <div className="lotus-lake-sky" />

      {/* Sun rays then orb */}
      <div className="lotus-lake-sunrays" />
      <div className="lotus-lake-sun" />

      {/* Landscape */}
      <div className="lotus-lake-hill is-far"  />
      <div className="lotus-lake-hill is-mid"  />
      <div className="lotus-lake-hill is-near" />
      <div className="lotus-lake-temple" />

      {/* Flock of birds — 5 */}
      <Bird className="lotus-lake-bird is-1" />
      <Bird className="lotus-lake-bird is-2" />
      <Bird className="lotus-lake-bird is-3" />
      <Bird className="lotus-lake-bird is-4" />
      <Bird className="lotus-lake-bird is-5" />

      {/* Lake */}
      <div className="lotus-lake-water" />
      <div className="lotus-lake-water-shimmer" />
      <div className="lotus-lake-water-waves"   />

      {/* Lotus flowers */}
      <div className="lotus-lake-flower is-left">
        <Lotus side="l" />
      </div>
      <div className="lotus-lake-flower is-right">
        <Lotus side="r" />
      </div>

      {/* Heart outline */}
      <HeartOutline />

      {/* Water sparkles */}
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
