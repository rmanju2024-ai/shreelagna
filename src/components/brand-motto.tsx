import { SITE_TAGLINE } from "@/lib/brand";

export function BrandMotto({
  as: Tag = "p",
}: {
  as?: "p" | "h1";
}) {
  return (
    <Tag className="brand-motto" aria-label={SITE_TAGLINE}>
      <span>Where hearts unite and families bloom.</span>
      <i className="brand-motto-rule" aria-hidden />
    </Tag>
  );
}
