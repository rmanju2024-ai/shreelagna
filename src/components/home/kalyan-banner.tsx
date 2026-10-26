"use client";

/**
 * Pearl-drop banner — "One drop of rain. One heart. Love begins."
 *
 * Scene (all drawn in code, no photos):
 *   – Blush-lavender dawn sky with soft haze
 *   – Rain falling as diagonal CSS stripes
 *   – Three layers of teal hills fading into mist
 *   – Swaying leaves in corners
 *   – Dark, still pond at the bottom with faint sky reflection
 *
 * Animation (9-second loop):
 *   0–2.6s  Pearl-pink heart-shaped drop falls through rain onto pond
 *   2.6–4s  Drop lands → ripples spread across pond surface
 *   4–7.5s  Drop rises as a warm-gold glowing heart with sparkles
 *   7.5–9s  Heart fades at peak → rain resets the loop
 */

/* ── SVG: Falling pearl-heart drop ─────────────────────────── */
function FallingDrop() {
  return (
    <svg className="pearl-drop" viewBox="0 0 28 30" fill="none" aria-hidden>
      <defs>
        <radialGradient id="fd-r" cx="38%" cy="30%">
          <stop offset="0%"   stopColor="#fff0f8" />
          <stop offset="40%"  stopColor="#f4a8cc" />
          <stop offset="100%" stopColor="#c85888" />
        </radialGradient>
        <filter id="fd-g" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="2" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      {/* Heart shape — the falling drop */}
      <path
        d="M14 26C7 21 2 16 2 10 2 6 5 3 9 3c2.5 0 4 1.5 5 3.5C15 4.5 16.5 3 19 3c4 0 7 3 7 7 0 6-5 11-12 16Z"
        fill="url(#fd-r)" filter="url(#fd-g)"
      />
      {/* Specular shine */}
      <path d="M7 7 Q10 4.5 13 5.5" stroke="#fff" strokeWidth="1.1"
        strokeLinecap="round" opacity=".6" />
    </svg>
  );
}

/* ── SVG: Rising golden glow-heart ─────────────────────────── */
function RisingHeart() {
  return (
    <svg viewBox="0 0 60 58" fill="none" aria-hidden>
      <defs>
        <radialGradient id="rh-r" cx="40%" cy="30%">
          <stop offset="0%"   stopColor="#fffde8" />
          <stop offset="28%"  stopColor="#fde8a8" />
          <stop offset="62%"  stopColor="#f8c060" />
          <stop offset="100%" stopColor="#e88c20" />
        </radialGradient>
        {/* Wide golden halo */}
        <filter id="rh-halo" x="-70%" y="-70%" width="240%" height="240%">
          <feGaussianBlur stdDeviation="7" />
        </filter>
        {/* Soft inner glow */}
        <filter id="rh-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2.5" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      {/* Halo */}
      <path
        d="M30 52C15 44 4 33 4 20 4 11 11 5 20 5c5 0 9 3 10 7.5C31 8 35 5 40 5c9 0 16 6 16 15 0 13-11 23-26 32Z"
        fill="#f8c060" filter="url(#rh-halo)" opacity=".7"
      />
      {/* Heart body */}
      <path
        d="M30 52C15 44 4 33 4 20 4 11 11 5 20 5c5 0 9 3 10 7.5C31 8 35 5 40 5c9 0 16 6 16 15 0 13-11 23-26 32Z"
        fill="url(#rh-r)" filter="url(#rh-glow)"
      />
      {/* Specular */}
      <path d="M12 13 Q18 9 24 11" stroke="#fff" strokeWidth="1.8"
        strokeLinecap="round" opacity=".65" />
    </svg>
  );
}

/* ── Main banner ─────────────────────────────────────────────── */
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

      {/* ── Sky ── */}
      <div className="pearl-sky" />

      {/* ── Rain (CSS animated diagonal stripes) ── */}
      <div className="pearl-rain" />

      {/* ── Drifting mist bands ── */}
      <div className="pearl-mist is-a" />
      <div className="pearl-mist is-b" />

      {/* ── Three-layer teal hills ── */}
      <div className="pearl-hill is-far"  />
      <div className="pearl-hill is-mid"  />
      <div className="pearl-hill is-near" />

      {/* ── Swaying corner leaves ── */}
      <div className="pearl-leaf is-tl" />
      <div className="pearl-leaf is-tr" />

      {/* ── Still, dark pond ── */}
      <div className="pearl-pond" />
      <div className="pearl-pond-glow" />

      {/* ── Animation: falling pearl drop ── */}
      <FallingDrop />

      {/* ── Animation: pond ripples at impact ── */}
      <span className="pearl-ripple is-1" />
      <span className="pearl-ripple is-2" />
      <span className="pearl-ripple is-3" />

      {/* ── Animation: rising glow-heart + sparkles (grouped for sync movement) ── */}
      <div className="pearl-heart-group">
        <div className="pearl-heart">
          <RisingHeart />
        </div>
        <span className="pearl-sparkle is-1" />
        <span className="pearl-sparkle is-2" />
        <span className="pearl-sparkle is-3" />
        <span className="pearl-sparkle is-4" />
        <span className="pearl-sparkle is-5" />
      </div>

      {hero && veil ? <div className="pearl-veil" /> : null}
    </div>
  );
}
