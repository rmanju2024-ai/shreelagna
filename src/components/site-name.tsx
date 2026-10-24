import { SITE_NAME, SITE_TLD } from "@/lib/brand";

export function SiteName({
  light = false,
  className = "",
}: {
  light?: boolean;
  className?: string;
}) {
  return (
    <span className={`site-name ${light ? "is-light" : ""} ${className}`.trim()}>
      <span className="site-name-word">{SITE_NAME}</span>
      <span className="site-tld" aria-label={SITE_TLD}>
        {SITE_TLD}
      </span>
    </span>
  );
}
