import { SITE_BRAND, SITE_TLD } from "@/lib/brand";

function LoveBirds() {
  return (
    <svg className="site-birds" viewBox="0 0 28 18" aria-hidden>
      <path
        fill="#ff5d8f"
        d="M11.2 14.2c-3.2.2-6.2-1.8-7.4-4.8C2.4 6.2 4 3.2 6.8 2.6c1.6-.4 3.2.3 4.2 1.5.4-1.6 1.8-2.6 3.4-2.2 2.2.5 3.4 3 2.6 5.6-.8 2.6-3.4 4.8-5.8 6.7z"
      />
      <path
        fill="#7c5cff"
        d="M16.8 14.2c3.2.2 6.2-1.8 7.4-4.8C25.6 6.2 24 3.2 21.2 2.6c-1.6-.4-3.2.3-4.2 1.5-.4-1.6-1.8-2.6-3.4-2.2-2.2.5-3.4 3-2.6 5.6.8 2.6 3.4 4.8 5.8 6.7z"
      />
      <path fill="#f5c84c" d="M13.2 8.6c.5-1.1 1.1-1.1 1.6 0 .3.7-.2 1.4-.8 1.8-.6-.4-1.1-1.1-.8-1.8z" />
      <circle cx="8.2" cy="6.4" r="0.55" fill="#1a100c" />
      <circle cx="19.8" cy="6.4" r="0.55" fill="#1a100c" />
    </svg>
  );
}

export function SiteName({
  light = false,
  className = "",
}: {
  light?: boolean;
  className?: string;
}) {
  return (
    <span className={`site-name ${light ? "is-light" : ""} ${className}`.trim()} aria-label={SITE_BRAND}>
      <span className="site-name-word">Marriage</span>
      <LoveBirds />
      <span className="site-name-word">Connect</span>
      <span className="site-tld" aria-label={SITE_TLD}>
        {SITE_TLD}
      </span>
    </span>
  );
}
