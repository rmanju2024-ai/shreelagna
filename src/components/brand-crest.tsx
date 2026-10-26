export function BrandCrest() {
  return (
    <span className="brand-crest" aria-hidden>
      <svg viewBox="0 0 72 68" fill="none">
        <defs>
          {/* Left half — rich maroon with luminous highlight */}
          <radialGradient id="cl-l" cx="38%" cy="28%">
            <stop offset="0%" stopColor="#e8687a" />
            <stop offset="40%" stopColor="#a02030" />
            <stop offset="80%" stopColor="#6e1020" />
            <stop offset="100%" stopColor="#4a0818" />
          </radialGradient>
          {/* Right half — warm 24-carat gold */}
          <radialGradient id="cl-r" cx="62%" cy="28%">
            <stop offset="0%" stopColor="#fff0a0" />
            <stop offset="30%" stopColor="#f5c840" />
            <stop offset="65%" stopColor="#c88020" />
            <stop offset="100%" stopColor="#8a5010" />
          </radialGradient>
          {/* Outer rim — thin gold stroke */}
          <linearGradient id="cl-rim" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fde880" />
            <stop offset="50%" stopColor="#c88020" />
            <stop offset="100%" stopColor="#fde880" />
          </linearGradient>
          {/* Drop shadow filter */}
          <filter id="cl-sh" x="-15%" y="-10%" width="130%" height="130%">
            <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#3a0808" floodOpacity="0.38"/>
          </filter>
          {/* Soft inner glow */}
          <filter id="cl-gl" x="-10%" y="-10%" width="120%" height="120%">
            <feGaussianBlur stdDeviation="1.2" result="b"/>
            <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>

        {/* Left half — maroon */}
        <path
          d="M36 60 C22 52 6 40 4 24 3 13 11 5 20 5 26 5 31 9 36 16"
          fill="url(#cl-l)" filter="url(#cl-sh)"
        />
        {/* Right half — gold */}
        <path
          d="M36 60 C50 52 66 40 68 24 69 13 61 5 52 5 46 5 41 9 36 16"
          fill="url(#cl-r)" filter="url(#cl-sh)"
        />

        {/* Gold rim outline */}
        <path
          d="M36 60 C22 52 6 40 4 24 3 13 11 5 20 5 26 5 31 9 36 16
             C41 9 46 5 52 5 C61 5 69 13 68 24 C66 40 50 52 36 60Z"
          fill="none"
          stroke="url(#cl-rim)"
          strokeWidth="1.2"
          opacity=".6"
        />

        {/* Specular on maroon half */}
        <path d="M12 13 C16 9 22 9 26 12" stroke="#ffb8c8" strokeWidth="1.8" strokeLinecap="round" opacity=".6"/>
        {/* Specular on gold half */}
        <path d="M46 12 C50 9 56 9 60 13" stroke="#fffbe0" strokeWidth="1.8" strokeLinecap="round" opacity=".7"/>

        {/* Centreline glow — where two halves meet */}
        <line x1="36" y1="16" x2="36" y2="60"
          stroke="url(#cl-rim)" strokeWidth="1.2" opacity=".35" />

        {/* Inner warm highlight bubble — centre top */}
        <ellipse cx="36" cy="22" rx="5" ry="4" fill="#fff" opacity=".12" />
      </svg>
    </span>
  );
}
