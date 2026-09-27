import { cookies } from "next/headers";
import { sessionFromCookieValue, type HouseSession } from "@/lib/auth/session-cookie";
import { trustSystemCa } from "@/lib/node/trust-system-ca";

export async function readSessionFromCookies(): Promise<HouseSession | undefined> {
  const store = await cookies();
  const related = store
    .getAll()
    .filter((c) => c.name.includes("-auth-token") && !c.name.includes("code-verifier"))
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
  if (!related.length) return undefined;
  const chunked = related.filter((c) => /\.\d+$/.test(c.name));
  const raw = (chunked.length ? chunked : related).map((c) => c.value).join("");
  return sessionFromCookieValue(raw);
}

type RestError = { message?: string; code?: string; details?: string; hint?: string };

export async function restInsertProfile(
  accessToken: string,
  payload: Record<string, unknown>,
): Promise<{ id: string | null; error: RestError | null }> {
  trustSystemCa();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    return { id: null, error: { message: "Missing house connection." } };
  }

  const res = await fetch(`${url}/rest/v1/profiles`, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  });
  const text = await res.text();
  let json: unknown = null;
  try {
    json = JSON.parse(text);
  } catch {
    json = null;
  }
  if (!res.ok) {
    const err =
      json && typeof json === "object"
        ? (json as RestError)
        : { message: text.slice(0, 180), code: String(res.status) };
    return { id: null, error: err };
  }
  const row = Array.isArray(json) ? json[0] : json;
  if (row && typeof row === "object" && "id" in row && typeof (row as { id: unknown }).id === "string") {
    return { id: (row as { id: string }).id, error: null };
  }
  return { id: null, error: null };
}
