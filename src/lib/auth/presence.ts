import { createClient, createServiceClient } from "@/lib/supabase/server";
import { istDayKey } from "@/lib/time/ist";

export async function writeLastSeen(userId: string) {
  const now = new Date().toISOString();
  const db = createServiceClient() ?? (await createClient());
  await Promise.all([
    db.from("app_users").update({ last_seen_at: now }).eq("id", userId),
    db.from("profiles").update({ last_seen_at: now }).eq("created_by", userId),
    db.from("presence_days").upsert(
      { user_id: userId, day: istDayKey(new Date()) },
      { onConflict: "user_id,day", ignoreDuplicates: true },
    ),
  ]).catch(() => {
    /* last seen is best-effort */
  });
}
