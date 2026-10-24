const DEFAULT_LIVE = "https://www.marriageconnect.in";

export function publicSiteOrigin(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim() || DEFAULT_LIVE;
  return raw.replace(/\/$/, "");
}

export function liveSiteHost(host: string | null | undefined): boolean {
  const name = String(host ?? "").split(":")[0].toLowerCase();
  return name === "marriageconnect.in" || name === "www.marriageconnect.in";
}

export function requestSiteOrigin(request: { nextUrl: { protocol: string; host: string } }): string {
  if (liveSiteHost(request.nextUrl.host)) {
    return `${request.nextUrl.protocol}//${request.nextUrl.host.split(":")[0]}`;
  }
  return publicSiteOrigin();
}

export function supabaseApiOrigin(): string | null {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim().replace(/\/$/, "") || "";
  if (!raw) return null;
  try {
    const host = new URL(raw).hostname.toLowerCase();
    if (host.endsWith("supabase.co") || host.endsWith("supabase.in") || host.includes("supabase")) return raw;
  } catch {
    return null;
  }
  return null;
}

export function supabaseAuthUrl(pathAndQuery: string): string | null {
  const base = supabaseApiOrigin();
  if (!base) return null;
  const path = pathAndQuery.startsWith("/") ? pathAndQuery : `/${pathAndQuery}`;
  return `${base}${path}`;
}

export function fixOAuthStartUrl(raw: string): string {
  const base = supabaseApiOrigin();
  if (!base) return raw;
  try {
    const url = new URL(raw, base);
    const host = url.hostname.toLowerCase();
    if (host.endsWith("supabase.co") || host.endsWith("supabase.in") || host.includes("supabase")) {
      return url.toString();
    }
    return `${base}${url.pathname}${url.search}`;
  } catch {
    return raw;
  }
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
