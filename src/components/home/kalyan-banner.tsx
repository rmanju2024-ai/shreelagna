"use client";

/**
 * KalyanBanner v4 — Sunrise lake, premium natural illustration
 *
 * Lotus technique:
 *  • Petals drawn back-to-front (SVG painter's algorithm)
 *  • Front petals are LONGER than back petals (perspective foreshortening)
 *  • scaleY(0.72) on the whole flower group simulates 3/4 tilt
 *  • White midrib vein on each petal for organic depth
 *
 * Scene: warm peachy sunrise · rolling hills · temple · birds · teal lake
 */

/* ────────────────── Lotus ────────────────────────────────────── */

/**
 * Returns the length of an outer petal based on its rotation angle.
 * Angle 180° = pointing DOWN = front of flower = longest petal.
 * Angle   0° = pointing UP   = back of flower  = shortest petal.
 */
function outerL(a: number) {
  return 56 + 14 * Math.cos(((a - 180) * Math.PI) / 180);
}
function midL(a: number) {
  return 40 + 9 * Math.cos(((a - 180) * Math.PI) / 180);
}

/**
 * Smooth natural petal path: base at origin, tip pointing UP (negative Y).
 * Width scales proportionally with length for consistent shape.
 */
function petal(l: number): string {
  const w = l * 0.27; // max half-width
  return (
    `M0 6 ` +
    `C${-w} ${-l * 0.16},${-w * 0.88} ${-l * 0.60},0 ${-l} ` +
    `C${w * 0.88} ${-l * 0.60},${w} ${-l * 0.16},0 6Z`
  );
}
function vein(l: number): string {
  return `M0 5 L0 ${-l + 5}`;
}

// Draw order: back angles first (will be UNDER front petals)
// 0° = tip pointing UP = back of flower (drawn first, hidden underneath)
// 180° = tip pointing DOWN = front of flower (drawn last, on top)
const OUTER_ORDER = [0, 30, 330, 60, 300, 90, 270, 120, 240, 150, 210, 180];
const MID_ORDER   = [22, 338, 67, 293, 112, 248, 157, 202];
const INNER_ORDER = [0, 72, 144, 216, 288];

function Lotus({ side }: { side: "l" | "r" }) {
  const p = side;
  return (
    <svg viewBox="0 0 200 210" fill="none" aria-hidden>
      <defs>
        {/* Lily pad — bright natural green */}
        <radialGradient id={`${p}gpad`} cx="38%" cy="26%">
          <stop offset="0%"   stopColor="#cef090" />
          <stop offset="48%"  stopColor="#5cc838" />
          <stop offset="100%" stopColor="#267810" />
        </radialGradient>
        {/* Water glow beneath */}
        <radialGradient id={`${p}ggw`} cx="50%" cy="55%">
          <stop offset="0%"   stopColor="#98e8d8" stopOpacity=".7" />
          <stop offset="100%" stopColor="#98e8d8" stopOpacity="0"  />
        </radialGradient>
        {/* Outer petals — vibrant rose-pink, highlight near tip */}
        <radialGradient id={`${p}gop`} cx="50%" cy="28%">
          <stop offset="0%"   stopColor="#feeaf4" />
          <stop offset="25%"  stopColor="#f590b8" />
          <stop offset="62%"  stopColor="#e0608c" />
          <stop offset="100%" stopColor="#be3c6a" />
        </radialGradient>
        {/* Middle petals — slightly lighter, showing the interior bloom */}
        <radialGradient id={`${p}gmp`} cx="50%" cy="28%">
          <stop offset="0%"   stopColor="#fff4f9" />
          <stop offset="22%"  stopColor="#f8bcd4" />
          <stop offset="100%" stopColor="#e07298" />
        </radialGradient>
        {/* Inner petals — blush-white, nearly closed */}
        <radialGradient id={`${p}gip`} cx="50%" cy="28%">
          <stop offset="0%"   stopColor="#ffffff" />
          <stop offset="18%"  stopColor="#fdecf5" />
          <stop offset="100%" stopColor="#f2accc" />
        </radialGradient>
        {/* Stamen — warm amber-gold */}
        <radialGradient id={`${p}gst`} cx="36%" cy="28%">
          <stop offset="0%"   stopColor="#fffde0" />
          <stop offset="36%"  stopColor="#f8d03c" />
          <stop offset="100%" stopColor="#be8010" />
        </radialGradient>
      </defs>

      {/* ── Water glow & lily pad ── */}
      <ellipse cx="100" cy="172" rx="66" ry="18" fill={`url(#${p}ggw)`} />
      <ellipse cx="100" cy="167" rx="56" ry="13" fill="#185810" opacity=".22" />
      <ellipse cx="100" cy="163" rx="56" ry="13" fill={`url(#${p}gpad)`} />
      <path d="M100 150 L100 163" stroke="#267810" strokeWidth="1.7"
        strokeLinecap="round" opacity=".42" />
      <ellipse cx="100" cy="167" rx="46" ry="5.5" fill="none"
        stroke="rgba(40,180,160,.42)" strokeWidth="1.2" />
      <ellipse cx="100" cy="170" rx="68" ry="9.5" fill="none"
        stroke="rgba(40,180,160,.18)" strokeWidth=".8" />

      {/*
       * ── Flower group ──
       * translate(100,106): position flower centre in the SVG
       * scale(1, 0.72):    compress Y → simulates 3/4 perspective tilt
       */}
      <g transform="translate(100,106) scale(1, 0.72)">

        {/* Outer ring — 12 petals, back → front order, lengths vary by angle */}
        {OUTER_ORDER.map(a => {
          const l = outerL(a);
          return (
            <g key={`o${a}`} transform={`rotate(${a})`}>
              <path d={petal(l)} fill={`url(#${p}gop)`} />
              <path d={vein(l)} stroke="rgba(255,255,255,0.32)"
                strokeWidth="1.35" strokeLinecap="round" />
            </g>
          );
        })}

        {/* Middle ring — 8 petals, back → front */}
        {MID_ORDER.map(a => {
          const l = midL(a);
          return (
            <g key={`m${a}`} transform={`rotate(${a})`}>
              <path d={petal(l)} fill={`url(#${p}gmp)`} />
              <path d={vein(l)} stroke="rgba(255,255,255,0.24)"
                strokeWidth="1.05" strokeLinecap="round" />
            </g>
          );
        })}

        {/* Inner ring — 5 upright petals */}
        {INNER_ORDER.map(a => (
          <g key={`i${a}`} transform={`rotate(${a})`}>
            <path d={petal(22)} fill={`url(#${p}gip)`} />
          </g>
        ))}

        {/* Stamen */}
        <circle cx="0" cy="0" r="15"  fill={`url(#${p}gst)`} />
        <circle cx="0" cy="-2" r="7.5" fill="#fffde8" opacity=".95" />
        <circle cx="-3" cy="-5" r="3" fill="#fff"    opacity=".70" />
      </g>
    </svg>
  );
}

/* ────────────────── Bird silhouette ─────────────────────────── */
function Bird({ className }: { className: string }) {
  return (
    <svg className={className} viewBox="0 0 48 22" fill="none" aria-hidden>
      <path d="M2 16 Q10 3 24 10"  stroke="#c07868" strokeWidth="3"
        strokeLinecap="round" fill="none" />
      <path d="M24 10 Q38 3 46 16" stroke="#c07868" strokeWidth="3"
        strokeLinecap="round" fill="none" />
      <circle cx="24" cy="11" r="2.2" fill="#c07868" />
    </svg>
  );
}

/* ────────────────── Gold outline heart ──────────────────────── */
function HeartGold() {
  return (
    <svg className="lotus-lake-heart" viewBox="0 0 64 60" fill="none" aria-hidden>
      <defs>
        <linearGradient id="hgrd" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="#fde060" />
          <stop offset="50%"  stopColor="#f09820" />
          <stop offset="100%" stopColor="#fde060" />
        </linearGradient>
        <filter id="hblr" x="-55%" y="-55%" width="210%" height="210%">
          <feGaussianBlur stdDeviation="4" />
        </filter>
      </defs>
      {/* glow halo */}
      <path d="M32 53C17 44 4 33 4 20 4 11 11 5 20 5c5 0 9 3 12 8 3-5 7-8 12-8 9 0 16 6 16 15 0 13-13 24-28 33Z"
        stroke="#f09820" strokeWidth="9" strokeLinejoin="round"
        fill="none" filter="url(#hblr)" opacity=".65" />
      {/* main outline */}
      <path d="M32 53C17 44 4 33 4 20 4 11 11 5 20 5c5 0 9 3 12 8 3-5 7-8 12-8 9 0 16 6 16 15 0 13-13 24-28 33Z"
        stroke="url(#hgrd)" strokeWidth="2.8" strokeLinejoin="round"
        fill="rgba(253,224,96,0.12)" />
    </svg>
  );
}

/* ────────────────── Main component ──────────────────────────── */
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

      {/* Sun */}
      <div className="lotus-lake-sunrays" />
      <div className="lotus-lake-sun" />

      {/* Landscape */}
      <div className="lotus-lake-hill is-far"  />
      <div className="lotus-lake-hill is-mid"  />
      <div className="lotus-lake-hill is-near" />
      <div className="lotus-lake-temple" />

      {/* Birds */}
      <Bird className="lotus-lake-bird is-1" />
      <Bird className="lotus-lake-bird is-2" />
      <Bird className="lotus-lake-bird is-3" />
      <Bird className="lotus-lake-bird is-4" />
      <Bird className="lotus-lake-bird is-5" />

      {/* Lake */}
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

      {/* Heart */}
      <HeartGold />

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
