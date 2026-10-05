/** Compact wedding-house seal: bride and groom facing a shared flame. */
export function HouseCrest({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 72 72" aria-hidden>
      <circle cx="36" cy="36" r="34" fill="#3f0e0d" />
      <circle cx="36" cy="36" r="30.5" fill="none" stroke="#e8b84a" strokeWidth="1.6" />
      <circle cx="36" cy="36" r="27.2" fill="none" stroke="#fde68a" strokeWidth="0.6" opacity="0.7" />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
        <ellipse
          key={deg}
          cx="36"
          cy="8.8"
          rx="2.1"
          ry="3.4"
          fill="#f5c84c"
          transform={`rotate(${deg} 36 36)`}
        />
      ))}
      <path d="M22 50 C22 42 27 38 31 38 C33.2 38 34.6 39.2 36 41.2 C37.4 39.2 38.8 38 41 38 C45 38 50 42 50 50 C50 56 44 60 36 62 C28 60 22 56 22 50 Z" fill="#7c2d12" />
      <circle cx="27.5" cy="32" r="5.1" fill="#f8e7c8" />
      <path d="M22.8 28.4 C24.2 24.6 30.6 24.4 32.4 28.6 C30 26.8 25.6 26.8 22.8 28.4 Z" fill="#c2415a" />
      <circle cx="27.5" cy="31.2" r="0.7" fill="#be185d" />
      <path d="M23.2 38.5 C24.4 36.2 26.4 35.2 27.8 35.2 C29.6 35.2 31.4 36.6 32.2 38.8 C29.6 42.2 25.8 44 23.6 44.6 Z" fill="#c2415a" />
      <circle cx="44.5" cy="31.6" r="5.1" fill="#f8e7c8" />
      <path d="M39.6 27.2 C42 22.6 50.4 23.4 50.8 29.4 C48.2 26.2 42.6 25.6 39.6 27.2 Z" fill="#9a3412" />
      <path d="M49.6 22.4 L53.2 16.6 L51.4 23.6 Z" fill="#f5c84c" />
      <path d="M40.2 38.2 C41.4 36.2 43.4 35 44.8 35 C46.6 35 48.8 36.6 49.6 39 C47.2 42.6 43.2 44.4 40.6 44.8 Z" fill="#9a3412" />
      <path d="M36 36.5 C37.6 34.2 40.4 34.4 41.2 36.8 C41.2 39.2 36 42.4 36 42.4 C36 42.4 30.8 39.2 30.8 36.8 C31.6 34.4 34.4 34.2 36 36.5 Z" fill="#fb7185" />
      <path d="M36 43.2 C36.8 45.4 38.4 47.6 36 50.2 C33.6 47.6 35.2 45.4 36 43.2 Z" fill="#f5c84c" />
    </svg>
  );
}
