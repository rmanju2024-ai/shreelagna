export type HouseSession = {
  access_token: string;
  refresh_token: string;
};

export function decodeCookiePayload(raw: string): string | null {
  let value = raw;
  try {
    value = decodeURIComponent(raw);
  } catch {
    /* keep raw */
  }
  if (!value.startsWith("base64-")) return value;
  const b64 = value.slice(7).replace(/-/g, "+").replace(/_/g, "/");
  const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
  try {
    return Buffer.from(padded, "base64").toString("utf8");
  } catch {
    return null;
  }
}

export function sessionFromCookieValue(raw: string): HouseSession | undefined {
  const decoded = decodeCookiePayload(raw);
  if (!decoded) return undefined;
  try {
    const parsed = JSON.parse(decoded) as {
      access_token?: string;
      refresh_token?: string;
      currentSession?: { access_token?: string; refresh_token?: string };
    };
    const access = parsed.access_token ?? parsed.currentSession?.access_token;
    const refresh = parsed.refresh_token ?? parsed.currentSession?.refresh_token;
    if (access && refresh) return { access_token: access, refresh_token: refresh };
  } catch {
    /* not json */
  }
  return undefined;
}

export function tokenFromRawCookie(raw: string): string | undefined {
  return sessionFromCookieValue(raw)?.access_token;
}
