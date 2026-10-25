import { SITE_BRAND, SITE_TLD } from "@/lib/brand";

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
      <span className="site-name-word is-connect">Connect</span>
      <span className="site-tld" aria-label={SITE_TLD}>
        {SITE_TLD}
      </span>
    </span>
  );
}
