export const SITE_NAME = "MarriageConnect";
export const SITE_TLD = ".in";
export const SITE_BRAND = `${SITE_NAME}${SITE_TLD}`;
export const SITE_TAGLINE = "Where hearts unite and families bloom.";
export const SITE_PROMISE = "Two families. One lagna. A rishta written with care.";

export function watermarkLine(name?: string | null): string {
  const who = (name ?? "").trim();
  return who ? `${who} · ${SITE_BRAND}` : SITE_BRAND;
}
