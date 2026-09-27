export const SITE_NAME = "Shree Lagna";

export function watermarkLine(name?: string | null): string {
  const who = (name ?? "").trim();
  return who ? `${who} · ${SITE_NAME}` : SITE_NAME;
}
