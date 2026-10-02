import { collapseNotices, noticesForActiveProfiles } from "@/lib/match/collapse-notices";
import { createServiceClient } from "@/lib/supabase/server";

export async function unreadNoticeBadge(userId: string) {
  const db = createServiceClient();
  if (!db) return { chatUnread: 0, alertUnread: 0 };
  const { data } = await db
    .from("notices")
    .select("id, kind, match_profile_id, created_at")
    .eq("user_id", userId)
    .is("read_at", null)
    .order("created_at", { ascending: false })
    .limit(80);
  const collapsed = collapseNotices(data ?? []);
  const profileIds = [...new Set(collapsed.map((row) => row.match_profile_id).filter(Boolean))] as string[];
  const { data: active } = profileIds.length
    ? await db.from("profiles").select("id").in("id", profileIds).eq("status", "active")
    : { data: [] as { id: string }[] };
  const open = noticesForActiveProfiles(collapsed, new Set((active ?? []).map((row) => row.id)));
  return {
    chatUnread: open.filter((row) => row.kind === "chat").length,
    alertUnread: open.filter((row) => row.kind !== "chat").length,
  };
}
