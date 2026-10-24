const DEFAULT_LIVE = "https://www.marriageconnect.in";
/** Auth API host — never the public website. */
const DEFAULT_SUPABASE = "https://polctldhftsztcjwsvel.supabase.co";

function isSupabaseApiHost(host: string): boolean {
  const name = host.toLowerCase();
  return name.endsWith(".supabase.co") || name.endsWith(".supabase.in");
}

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

export function supabaseApiOrigin(): string {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim().replace(/\/$/, "") || "";
  try {
    if (raw && isSupabaseApiHost(new URL(raw).hostname)) return raw;
  } catch {
    /* use default */
  }
  return DEFAULT_SUPABASE;
}

export function supabaseAuthUrl(pathAndQuery: string): string {
  const path = pathAndQuery.startsWith("/") ? pathAndQuery : `/${pathAndQuery}`;
  return `${supabaseApiOrigin()}${path}`;
}

export function fixOAuthStartUrl(raw: string): string {
  const base = supabaseApiOrigin();
  try {
    const url = new URL(raw, base);
    if (isSupabaseApiHost(url.hostname)) return url.toString();
    return `${base}${url.pathname}${url.search}`;
  } catch {
    return `${base}/auth/v1/authorize`;
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
