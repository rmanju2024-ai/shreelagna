function Lotus({ className }: { className: string }) {
  return (
    <svg className={className} viewBox="0 0 120 110" fill="none" aria-hidden>
      <ellipse cx="60" cy="96" rx="34" ry="8" fill="#3f9a4a" opacity=".35" />
      <ellipse cx="60" cy="92" rx="28" ry="10" fill="#4caf50" />
      <path d="M60 86c-18 2-28 14-28 14s14-4 28-4 28 4 28 4-10-12-28-14Z" fill="#2e7d32" />
      <path d="M60 78C38 70 24 44 32 28c8 12 20 22 28 26 8-4 20-14 28-26 8 16-6 42-28 50Z" fill="#f4a7c1" />
      <path d="M60 78C46 58 44 28 60 12c16 16 14 46 0 66Z" fill="#ec6fa0" />
      <path d="M60 78c8-16 28-28 40-30-8 22-22 34-40 30Z" fill="#ff8fb3" />
      <path d="M60 78c-8-16-28-28-40-30 8 22 22 34 40 30Z" fill="#ff8fb3" />
      <path d="M60 74c-6-14-6-28 0-40 6 12 6 26 0 40Z" fill="#ffd0e2" />
      <circle cx="60" cy="52" r="5" fill="#f3c56a" />
    </svg>
  );
}

export function KalyanBanner({
  intensity = "hero",
  presentation = "cover",
  veil = true,
}: {
  intensity?: "hero" | "wash";
  presentation?: "cover" | "complete";
  veil?: boolean;
}) {
  const hero = intensity === "hero";
  return (
    <div className={`lotus-lake${hero ? " is-hero" : " is-wash"}`} aria-hidden>
      <div className="lotus-lake-sky" />
      <span className="lotus-lake-sun" />
      <span className="lotus-lake-ray" />
      <span className="lotus-lake-hill" />
      <span className="lotus-lake-keep" />
      <span className="lotus-lake-bird is-a" />
      <span className="lotus-lake-bird is-b" />
      <div className="lotus-lake-water" />
      <span className="lotus-lake-bloom is-tiny is-l" />
      <span className="lotus-lake-bloom is-tiny is-r" />
      <Lotus className="lotus-lake-flower is-left" />
      <Lotus className="lotus-lake-flower is-right" />
      <svg className="lotus-lake-heart" viewBox="0 0 24 22" aria-hidden>
        <path
          fill="#c47a22"
          d="M12 21S2 14.2 2 8.2C2 4.8 4.7 2.5 7.8 2.5 9.8 2.5 11.3 3.5 12 5.1 12.7 3.5 14.2 2.5 16.2 2.5 19.3 2.5 22 4.8 22 8.2 22 14.2 12 21 12 21Z"
        />
      </svg>
      <span className="lotus-lake-petal is-1" />
      <span className="lotus-lake-petal is-2" />
      <span className="lotus-lake-petal is-3" />
      {hero && veil ? <div className="lotus-lake-veil" /> : null}
    </div>
  );
}
