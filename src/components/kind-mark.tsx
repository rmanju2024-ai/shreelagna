function BrideMark() {
  return (
    <svg viewBox="0 0 80 96" aria-hidden>
      <path
        d="M40 8 C22 10 14 28 16 44 C18 36 28 30 40 30 C52 30 62 36 64 44 C66 28 58 10 40 8 Z"
        fill="currentColor"
        opacity="0.28"
      />
      <circle cx="40" cy="34" r="12.5" fill="currentColor" />
      <path d="M32 24 C34 16 46 16 48 24 C44 20 36 20 32 24 Z" fill="currentColor" />
      <circle cx="40" cy="32" r="1.6" fill="#fde68a" />
      <path
        d="M26 48 C28 44 36 42 40 42 C44 42 52 44 54 48 C62 58 70 78 68 90 L12 90 C10 78 18 58 26 48 Z"
        fill="currentColor"
      />
      <path d="M40 46 C36 52 34 58 34 64 C38 60 42 60 46 64 C46 58 44 52 40 46 Z" fill="#fde68a" opacity="0.85" />
      <path d="M22 90 C28 78 52 78 58 90" fill="none" stroke="#fde68a" strokeWidth="1.6" opacity="0.7" />
    </svg>
  );
}

function GroomMark() {
  return (
    <svg viewBox="0 0 80 96" aria-hidden>
      <path d="M24 28 C26 12 54 12 56 28 C52 18 28 18 24 28 Z" fill="currentColor" />
      <path d="M22 30 C24 22 56 22 58 30 C56 36 50 40 40 40 C30 40 24 36 22 30 Z" fill="currentColor" />
      <circle cx="40" cy="38" r="11.5" fill="currentColor" />
      <path d="M54 22 L62 10 L58 24 Z" fill="#fde68a" />
      <path
        d="M22 52 C26 46 34 44 40 44 C46 44 54 46 58 52 C66 62 70 82 68 90 L12 90 C10 82 14 62 22 52 Z"
        fill="currentColor"
      />
      <path d="M32 56 H48 V78 H32 Z" fill="#fde68a" opacity="0.75" />
      <path d="M40 56 V78" stroke="#7c2d12" strokeWidth="1.4" opacity="0.45" />
    </svg>
  );
}

export function KindMark({
  type,
  kind,
  className,
}: {
  type?: string | null;
  kind?: string | null;
  className?: string;
}) {
  const groom = type === "vara" || (!type && /groom|vara/i.test(kind ?? ""));
  const label = groom ? "Groom" : "Bride";
  return (
    <span className={`kind-mark${groom ? " is-groom" : " is-bride"}${className ? ` ${className}` : ""}`} role="img" aria-label={label} title={label}>
      {groom ? <GroomMark /> : <BrideMark />}
      <b>{label}</b>
    </span>
  );
}
