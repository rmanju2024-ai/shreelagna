const DEFAULT_LIVE = "https://www.marriageconnect.in";

export function publicSiteOrigin(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim() || DEFAULT_LIVE;
  return raw.replace(/\/$/, "");
}

export function isVercelPreviewHost(host: string | null | undefined): boolean {
  const name = String(host ?? "").split(":")[0].toLowerCase();
  return name.endsWith(".vercel.app");
}

export function canonicalSiteUrl(pathAndQuery: string, host?: string | null): string | null {
  if (!isVercelPreviewHost(host)) return null;
  const path = pathAndQuery.startsWith("/") ? pathAndQuery : `/${pathAndQuery}`;
  return `${publicSiteOrigin()}${path}`;
}
