import type { User } from "@supabase/supabase-js";
import { cache } from "react";
import { writeLastSeen } from "@/lib/auth/presence";
import { createClient } from "@/lib/supabase/server";
import { shouldTouchLastSeen } from "@/lib/profile/last-seen";

export const getAuth = cache(async () => {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return { supabase, user };
  } catch {
    return { supabase: null, user: null };
  }
});

export const ensureAppUser = cache(async (
  supabase: Awaited<ReturnType<typeof createClient>>,
  user: User,
) => {
  const email = user.email;
  if (!email) return null;

  const userCols =
    "id, email, display_name, role, active_profile_id, email_otp_verified_at, welcome_started_at, welcome_days";
  let existing = (
    await supabase.from("app_users").select(`${userCols}, last_seen_at`).eq("id", user.id).maybeSingle()
  ).data;
  if (!existing) {
    const retry = await supabase.from("app_users").select(userCols).eq("id", user.id).maybeSingle();
    existing = retry.data ? { ...retry.data, last_seen_at: null } : retry.data;
  }

  const verifiedAt =
    user.email_confirmed_at ?? existing?.email_otp_verified_at ?? new Date().toISOString();
  const displayName =
    (user.user_metadata?.full_name as string | undefined) ??
    existing?.display_name ??
    email.split("@")[0];

  if (!existing) {
    const { data, error } = await supabase
      .from("app_users")
      .insert({
        id: user.id,
        email,
        display_name: displayName,
        email_otp_verified_at: verifiedAt,
        last_login_at: new Date().toISOString(),
        last_seen_at: new Date().toISOString(),
      })
      .select(
        "id, email, display_name, role, active_profile_id, email_otp_verified_at, welcome_started_at, welcome_days, last_seen_at",
      )
      .maybeSingle();
    if (error) return null;
    return data;
  }

  if (!existing.email_otp_verified_at) {
    const now = new Date().toISOString();
    await supabase
      .from("app_users")
      .update({
        email_otp_verified_at: verifiedAt,
        last_login_at: now,
        last_seen_at: now,
        display_name: displayName,
      })
      .eq("id", user.id);
    await writeLastSeen(user.id);
    return { ...existing, email_otp_verified_at: verifiedAt, display_name: displayName };
  }

  const seen = "last_seen_at" in existing ? String(existing.last_seen_at ?? "") : "";
  if (shouldTouchLastSeen(seen || null)) {
    await writeLastSeen(user.id);
  }

  return existing;
});

