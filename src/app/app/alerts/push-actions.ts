"use server";

import { ensureAppUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { readSessionFromCookies } from "@/lib/supabase/user-rest";

export type PushActionResult = { ok: true } | { ok: false; error: string };

type PushKeys = { endpoint: string; p256dh: string; auth: string; userAgent?: string };

async function memberDb() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in again." };
  const cookieSession = await readSessionFromCookies();
  if (cookieSession) await supabase.auth.setSession(cookieSession);
  const me = await ensureAppUser(supabase, user);
  if (!me) return { error: "Sign in again." };
  return { db: supabase, me };
}

export async function savePushSubscription(input: PushKeys): Promise<PushActionResult> {
  const auth = await memberDb();
  if ("error" in auth) return { ok: false, error: String(auth.error ?? "Sign in again.") };
  const endpoint = String(input.endpoint ?? "").trim();
  const p256dh = String(input.p256dh ?? "").trim();
  const authKey = String(input.auth ?? "").trim();
  if (!endpoint.startsWith("https://") || !p256dh || !authKey) {
    return { ok: false, error: "That notification subscription is incomplete." };
  }
  const { error } = await auth.db.from("push_subscriptions").upsert(
    {
      user_id: auth.me.id,
      profile_id: auth.me.active_profile_id,
      endpoint,
      p256dh,
      auth: authKey,
      user_agent: String(input.userAgent ?? "").slice(0, 400) || null,
    },
    { onConflict: "endpoint" },
  );
  if (error) return { ok: false, error: "Ask house to run SQL 072, then try again." };
  return { ok: true };
}

export async function dropPushSubscription(endpointRaw: string): Promise<PushActionResult> {
  const auth = await memberDb();
  if ("error" in auth) return { ok: false, error: String(auth.error ?? "Sign in again.") };
  const endpoint = String(endpointRaw ?? "").trim();
  if (!endpoint) return { ok: true };
  await auth.db.from("push_subscriptions").delete().eq("user_id", auth.me.id).eq("endpoint", endpoint);
  return { ok: true };
}
