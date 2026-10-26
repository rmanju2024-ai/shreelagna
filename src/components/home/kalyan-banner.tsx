"use client";

/**
 * KalyanBanner — natural sunrise lake
 * Lotus uses real teardrop-petal paths (NOT ellipses) — 12 outer + 8 mid + 5 inner rings
 * with white midrib veins for natural depth.
 */

/* ── Lotus bloom ─────────────────────────────────────────────── */
function Lotus({ side }: { side: "l" | "r" }) {
  const p = side;

  /*
   * All petals share the same base at origin (0, 0) and extend UPWARD.
   * They are then translated to the flower centre and rotated in place.
   * Shape: teardrop — narrow at base, widest in the middle-third, rounded tip.
   */
  const O = "M0 4 C-17 -14,-22 -50,0 -68 C22 -50,17 -14,0 4Z";   // outer  — 68u tall
  const M = "M0 3 C-13 -10,-16 -37,0 -50 C16 -37,13 -10,0 3Z";   // middle — 50u tall
  const I = "M0 2 C-8 -5,-9 -23,0 -30 C9 -23,8 -5,0 2Z";         // inner  — 30u tall

  const outerA = [0,30,60,90,120,150,180,210,240,270,300,330];      // 12 petals × 30°
  const midA   = [15,60,105,150,195,240,285,330];                    //  8 petals
  const innerA = [0,72,144,216,288];                                  //  5 petals

  // Midrib vein stroke (soft white line down petal centre)
  const veinO = "M0 3 L0 -65";
  const veinM = "M0 3 L0 -48";

  return (
    <svg viewBox="0 0 200 215" fill="none" aria-hidden>
      <defs>
        {/* Lily pad */}
        <radialGradient id={`${p}pad`} cx="40%" cy="28%">
          <stop offset="0%"   stopColor="#c8f088" />
          <stop offset="52%"  stopColor="#58be38" />
          <stop offset="100%" stopColor="#28780e" />
        </radialGradient>
        <radialGradient id={`${p}pgw`} cx="50%" cy="55%">
          <stop offset="0%"   stopColor="#a0ece0" stopOpacity=".7" />
          <stop offset="100%" stopColor="#a0ece0" stopOpacity="0" />
        </radialGradient>

        {/*
         * Outer petals — rich vibrant rose-pink.
         * cy="32%" puts the highlight at the upper-third of the bounding box.
         * This simulates light falling on the upper face of an outward-curving petal.
         */}
        <radialGradient id={`${p}op`} cx="50%" cy="32%">
          <stop offset="0%"   stopColor="#fde8f2" />
          <stop offset="30%"  stopColor="#f492b8" />
          <stop offset="68%"  stopColor="#e0608e" />
          <stop offset="100%" stopColor="#c24472" />
        </radialGradient>

        {/* Middle petals — slightly lighter, showing inner bloom */}
        <radialGradient id={`${p}mp`} cx="50%" cy="32%">
          <stop offset="0%"   stopColor="#fff5f9" />
          <stop offset="28%"  stopColor="#f8b8d4" />
          <stop offset="100%" stopColor="#e07098" />
        </radialGradient>

        {/* Inner petals — soft blush-white, nearly closed */}
        <radialGradient id={`${p}ip`} cx="50%" cy="32%">
          <stop offset="0%"   stopColor="#ffffff" />
          <stop offset="22%"  stopColor="#fde8f4" />
          <stop offset="100%" stopColor="#f0a8c8" />
        </radialGradient>

        {/* Stamen disc */}
        <radialGradient id={`${p}st`} cx="38%" cy="28%">
          <stop offset="0%"   stopColor="#fffde0" />
          <stop offset="38%"  stopColor="#f8d040" />
          <stop offset="100%" stopColor="#c08818" />
        </radialGradient>
      </defs>

      {/* ── Water glow beneath pad ── */}
      <ellipse cx="100" cy="170" rx="65" ry="18" fill={`url(#${p}pgw)`} />

      {/* ── Lily pad ── */}
      <ellipse cx="100" cy="165" rx="53" ry="13" fill="#1a5e14" opacity=".25" />
      <ellipse cx="100" cy="162" rx="53" ry="13" fill={`url(#${p}pad)`} />
      <path d="M100 149 L100 162" stroke="#28780e" strokeWidth="1.6" strokeLinecap="round" opacity=".45" />
      {/* Ripple rings */}
      <ellipse cx="100" cy="165" rx="44" ry="5.5" fill="none" stroke="rgba(48,185,165,.45)" strokeWidth="1.2" />
      <ellipse cx="100" cy="168" rx="66" ry="9"   fill="none" stroke="rgba(48,185,165,.18)" strokeWidth=".8" />

      {/* ── Outer ring — 12 petals ── */}
      {outerA.map(a => (
        <g key={`o${a}`} transform={`translate(100,108) rotate(${a})`}>
          <path d={O} fill={`url(#${p}op)`} />
          {/* midrib vein */}
          <path d={veinO} stroke="rgba(255,255,255,0.30)" strokeWidth="1.4" strokeLinecap="round" />
        </g>
      ))}

      {/* ── Middle ring — 8 petals ── */}
      {midA.map(a => (
        <g key={`m${a}`} transform={`translate(100,108) rotate(${a})`}>
          <path d={M} fill={`url(#${p}mp)`} />
          <path d={veinM} stroke="rgba(255,255,255,0.25)" strokeWidth="1.1" strokeLinecap="round" />
        </g>
      ))}

      {/* ── Inner ring — 5 upright petals ── */}
      {innerA.map(a => (
        <g key={`i${a}`} transform={`translate(100,108) rotate(${a})`}>
          <path d={I} fill={`url(#${p}ip)`} />
        </g>
      ))}

      {/* ── Stamen ── */}
      <circle cx="100" cy="108" r="14"  fill={`url(#${p}st)`} />
      <circle cx="100" cy="106" r="7"   fill="#fffde8" opacity=".95" />
      <circle cx="97"  cy="103" r="2.8" fill="#fff"    opacity=".70" />
    </svg>
  );
}

/* ── Bird (natural seagull silhouette) ───────────────────────── */
function Bird({ className }: { className: string }) {
  return (
    <svg className={className} viewBox="0 0 44 20" fill="none" aria-hidden>
      {/* Left wing arc — tapers from body outward */}
      <path d="M2 14 Q10 2 21 8"
        stroke="#b87870" strokeWidth="2.8" strokeLinecap="round" fill="none" />
      {/* Right wing arc */}
      <path d="M21 8 Q32 2 42 14"
        stroke="#b87870" strokeWidth="2.8" strokeLinecap="round" fill="none" />
      {/* Body centre dot */}
      <circle cx="21" cy="9" r="1.8" fill="#b87870" />
    </svg>
  );
}

/* ── Gold outline heart ──────────────────────────────────────── */
function HeartOutline() {
  return (
    <svg className="lotus-lake-heart" viewBox="0 0 60 56" fill="none" aria-hidden>
      <defs>
        <linearGradient id="hg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="#fde870" />
          <stop offset="50%"  stopColor="#f0a028" />
          <stop offset="100%" stopColor="#fde870" />
        </linearGradient>
        <filter id="hgf" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3.5" />
        </filter>
      </defs>
      {/* Glow */}
      <path d="M30 50C16 42 4 31 4 19 4 11 10 6 18 6c4 0 8 2.5 12 7 4-4.5 8-7 12-7 8 0 14 5 14 13 0 12-12 23-26 31Z"
        stroke="#f0a028" strokeWidth="7" strokeLinejoin="round" fill="none"
        filter="url(#hgf)" opacity=".65" />
      {/* Main stroke */}
      <path d="M30 50C16 42 4 31 4 19 4 11 10 6 18 6c4 0 8 2.5 12 7 4-4.5 8-7 12-7 8 0 14 5 14 13 0 12-12 23-26 31Z"
        stroke="url(#hg)" strokeWidth="2.6" strokeLinejoin="round"
        fill="rgba(253,232,100,0.10)" />
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

      {/* Sky layers */}
      <div className="lotus-lake-sky" />

      {/* Sun */}
      <div className="lotus-lake-sunrays" />
      <div className="lotus-lake-sun" />

      {/* Landscape */}
      <div className="lotus-lake-hill is-far"  />
      <div className="lotus-lake-hill is-mid"  />
      <div className="lotus-lake-hill is-near" />
      <div className="lotus-lake-temple" />

      {/* Birds — 5 clearly visible */}
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

      {/* Gold heart outline */}
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
