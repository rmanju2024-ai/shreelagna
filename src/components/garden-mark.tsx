export function GardenMark({ size = "logo" }: { size?: "mark" | "logo" }) {
  return (
    <span className={`garden-mark ${size === "logo" ? "is-logo" : "is-mark"}`} aria-hidden>
      <svg className="garden-mark-art" viewBox="0 0 120 120">
        <defs>
          <radialGradient id="gm-sky" cx="50%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#fff7ea" />
            <stop offset="100%" stopColor="#f3e0c4" />
          </radialGradient>
          <radialGradient id="gm-pink" cx="35%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#ffd0e4" />
            <stop offset="55%" stopColor="#ff5d8f" />
            <stop offset="100%" stopColor="#9c1d4a" />
          </radialGradient>
          <radialGradient id="gm-sun" cx="35%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#fff3b0" />
            <stop offset="55%" stopColor="#f5c84c" />
            <stop offset="100%" stopColor="#c47a12" />
          </radialGradient>
          <radialGradient id="gm-vio" cx="35%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#e4dcff" />
            <stop offset="55%" stopColor="#7c5cff" />
            <stop offset="100%" stopColor="#3b2a9a" />
          </radialGradient>
          <radialGradient id="gm-mint" cx="35%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#d4fff6" />
            <stop offset="55%" stopColor="#4fd1c5" />
            <stop offset="100%" stopColor="#0f766e" />
          </radialGradient>
          <radialGradient id="gm-orange" cx="35%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#ffe0c2" />
            <stop offset="55%" stopColor="#ff9a62" />
            <stop offset="100%" stopColor="#c2410c" />
          </radialGradient>
        </defs>

        <circle cx="60" cy="60" r="56" fill="url(#gm-sky)" opacity="0.35" />

        <g className="garden-leaf">
          <path d="M22 86c18-8 28-28 20-46-18 8-32 24-20 46z" fill="#2f9e49" />
          <path d="M98 88c-18-6-26-28-16-46 16 10 28 26 16 46z" fill="#138808" />
          <path d="M48 102c8-22 28-30 42-18-14 16-32 22-42 18z" fill="#3d9e4a" />
        </g>

        <g className="garden-bloom is-a">
          <circle cx="38" cy="48" r="16" fill="url(#gm-pink)" />
          <circle cx="28" cy="42" r="9" fill="url(#gm-pink)" />
          <circle cx="48" cy="40" r="9" fill="url(#gm-pink)" />
          <circle cx="30" cy="56" r="8" fill="url(#gm-pink)" />
          <circle cx="46" cy="56" r="8" fill="url(#gm-pink)" />
          <circle cx="38" cy="48" r="6" fill="#f5c84c" />
        </g>
        <g className="garden-bloom is-b">
          <circle cx="84" cy="40" r="15" fill="url(#gm-vio)" />
          <circle cx="74" cy="34" r="8" fill="url(#gm-vio)" />
          <circle cx="94" cy="34" r="8" fill="url(#gm-vio)" />
          <circle cx="76" cy="48" r="8" fill="url(#gm-vio)" />
          <circle cx="92" cy="48" r="8" fill="url(#gm-vio)" />
          <circle cx="84" cy="40" r="5.5" fill="#ffe7a3" />
        </g>
        <g className="garden-bloom is-c">
          <circle cx="62" cy="72" r="18" fill="url(#gm-sun)" />
          <circle cx="50" cy="64" r="9" fill="url(#gm-orange)" />
          <circle cx="74" cy="64" r="9" fill="url(#gm-orange)" />
          <circle cx="50" cy="80" r="9" fill="url(#gm-orange)" />
          <circle cx="74" cy="80" r="9" fill="url(#gm-orange)" />
          <circle cx="62" cy="72" r="7" fill="#7c2d12" />
        </g>
        <g className="garden-bloom is-d">
          <circle cx="28" cy="78" r="11" fill="url(#gm-mint)" />
          <circle cx="22" cy="74" r="6" fill="url(#gm-mint)" />
          <circle cx="34" cy="74" r="6" fill="url(#gm-mint)" />
          <circle cx="28" cy="78" r="4" fill="#fff7ea" />
        </g>
        <g className="garden-bloom is-e">
          <circle cx="96" cy="74" r="10" fill="url(#gm-pink)" />
          <circle cx="90" cy="70" r="5.5" fill="url(#gm-sun)" />
          <circle cx="102" cy="70" r="5.5" fill="url(#gm-sun)" />
          <circle cx="96" cy="74" r="3.6" fill="#fff" />
        </g>
        <circle cx="54" cy="34" r="4" fill="#ff5d8f" />
        <circle cx="70" cy="30" r="3.2" fill="#7c5cff" />
        <circle cx="44" cy="92" r="3" fill="#f5c84c" />
      </svg>
    </span>
  );
}
