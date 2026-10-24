export function BrandCrest() {
  return (
    <span className="brand-crest" aria-hidden>
      <svg viewBox="0 0 80 80">
        <defs>
          <linearGradient id="crest-gold" x1="0.2" y1="0" x2="0.9" y2="1">
            <stop offset="0%" stopColor="#f6e2b3" />
            <stop offset="45%" stopColor="#d4a85a" />
            <stop offset="100%" stopColor="#8a5a18" />
          </linearGradient>
        </defs>
        <circle cx="40" cy="40" r="36.5" fill="#fffaf2" stroke="url(#crest-gold)" strokeWidth="1.4" />
        <circle cx="40" cy="40" r="32.5" fill="none" stroke="url(#crest-gold)" strokeWidth="0.4" opacity="0.7" />
        <g fill="none" stroke="url(#crest-gold)" strokeWidth="1.35" strokeLinejoin="round" strokeLinecap="round">
          <path d="M40 54c-7-6-16-14-16-22 0-6 5-10 10-10 4 0 6 3 6 6 0-3 2-6 6-6 5 0 10 4 10 10 0 8-9 16-16 22z" />
          <path d="M40 54c-4-12-2-22 0-30 2 8 4 18 0 30z" />
          <path d="M28 36c4 2 8 4 12 4 4 0 8-2 12-4" />
          <path d="M24 44c5 3 10 6 16 7 6-1 11-4 16-7" />
        </g>
      </svg>
    </span>
  );
}
