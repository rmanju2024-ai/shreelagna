export function BrandCrest() {
  return (
    <span className="brand-crest" aria-hidden>
      <svg viewBox="0 0 64 60" fill="none">
        <defs>
          <radialGradient id="crest-l" cx="35%" cy="30%">
            <stop offset="0%" stopColor="#c45a6a" />
            <stop offset="60%" stopColor="#8a1f2b" />
            <stop offset="100%" stopColor="#5c0f18" />
          </radialGradient>
          <radialGradient id="crest-r" cx="65%" cy="30%">
            <stop offset="0%" stopColor="#f3c56a" />
            <stop offset="55%" stopColor="#c47a22" />
            <stop offset="100%" stopColor="#8a5218" />
          </radialGradient>
          <filter id="crest-shadow">
            <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#3f0e0d" floodOpacity="0.35" />
          </filter>
        </defs>
        {/* left half — maroon */}
        <path
          d="M32 53 C20 46 6 36 4 22 3 12 10 5 19 5 24 5 28 8 32 14"
          fill="url(#crest-l)" filter="url(#crest-shadow)"
        />
        {/* right half — gold */}
        <path
          d="M32 53 C44 46 58 36 60 22 61 12 54 5 45 5 40 5 36 8 32 14"
          fill="url(#crest-r)" filter="url(#crest-shadow)"
        />
        {/* specular sheen on left */}
        <path d="M14 11 C18 8 23 8 26 11" stroke="#ffd0d8" strokeWidth="2" strokeLinecap="round" opacity=".55" />
        {/* specular sheen on right */}
        <path d="M38 11 C41 8 46 8 50 11" stroke="#fff5c8" strokeWidth="2" strokeLinecap="round" opacity=".55" />
        {/* centre join line */}
        <line x1="32" y1="14" x2="32" y2="53" stroke="#fff" strokeWidth="0.8" opacity=".18" />
      </svg>
    </span>
  );
}
