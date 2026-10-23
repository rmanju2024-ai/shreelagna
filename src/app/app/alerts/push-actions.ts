"use server";

import { ensureAppUser } from "@/lib/auth/session";
import { vapidPublicKey } from "@/lib/notify/web-push";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { readSessionFromCookies } from "@/lib/supabase/user-rest";

export async function getPushClientConfig(): Promise<{ publicKey: string }> {
  return { publicKey: vapidPublicKey() };
}

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
  const db = createServiceClient() ?? auth.db;
  const { error } = await db.from("push_subscriptions").upsert(
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
  if (error) return { ok: false, error: "Could not save this device. Try again in a moment." };
  return { ok: true };
}

export async function dropPushSubscription(endpointRaw: string): Promise<PushActionResult> {
  const auth = await memberDb();
  if ("error" in auth) return { ok: false, error: String(auth.error ?? "Sign in again.") };
  const endpoint = String(endpointRaw ?? "").trim();
  if (!endpoint) return { ok: true };
  const db = createServiceClient() ?? auth.db;
  await db.from("push_subscriptions").delete().eq("user_id", auth.me.id).eq("endpoint", endpoint);
  return { ok: true };
}
