export function IndiaFlag({ className = "" }: { className?: string }) {
  const spokes = Array.from({ length: 24 }, (_, i) => i * 15);
  return (
    <svg
      className={`india-flag ${className}`.trim()}
      viewBox="0 0 30 20"
      aria-label="India"
      role="img"
    >
      <rect width="30" height="6.67" fill="#FF9933" />
      <rect y="6.67" width="30" height="6.67" fill="#fff" />
      <rect y="13.33" width="30" height="6.67" fill="#138808" />
      <circle cx="15" cy="10" r="2.55" fill="none" stroke="#000080" strokeWidth="0.7" />
      {spokes.map((deg) => (
        <line
          key={deg}
          x1="15"
          y1="10"
          x2={15 + Math.cos((deg * Math.PI) / 180) * 2.55}
          y2={10 + Math.sin((deg * Math.PI) / 180) * 2.55}
          stroke="#000080"
          strokeWidth="0.35"
        />
      ))}
    </svg>
  );
}
