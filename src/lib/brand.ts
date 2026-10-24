export const SITE_NAME = "MarriageConnect";
export const SITE_TLD = ".in";
export const SITE_BRAND = `${SITE_NAME}${SITE_TLD}`;
export const SITE_TAGLINE = "Where families meet with dignity.";
export const SITE_PROMISE =
  "Private introductions for Indian families. Verified profiles. Conversations that stay respectful.";

export function watermarkLine(name?: string | null): string {
  const who = (name ?? "").trim();
  return who ? `${who} · ${SITE_BRAND}` : SITE_BRAND;
}
