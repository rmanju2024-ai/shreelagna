import { collapseNotices, noticesForActiveProfiles } from "@/lib/match/collapse-notices";
import { createServiceClient } from "@/lib/supabase/server";

export async function unreadNoticeBadge(userId: string) {
  const db = createServiceClient();
  if (!db) return { chatUnread: 0, alertUnread: 0 };
  const { data, error } = await db
    .from("notices")
    .select("id, kind, match_profile_id, created_at")
    .eq("user_id", userId)
    .is("read_at", null)
    .order("created_at", { ascending: false })
    .limit(80);
  if (error) throw error;
  const collapsed = collapseNotices(data ?? []);
  const profileIds = [...new Set(collapsed.map((row) => row.match_profile_id).filter(Boolean))] as string[];
  const activeResult = profileIds.length
    ? await db.from("profiles").select("id").in("id", profileIds).eq("status", "active")
    : { data: [] as { id: string }[] };
  if ("error" in activeResult && activeResult.error) throw activeResult.error;
  const active = activeResult.data;
  const open = noticesForActiveProfiles(collapsed, new Set((active ?? []).map((row) => row.id)));
  return {
    chatUnread: open.filter((row) => row.kind === "chat").length,
    alertUnread: open.filter((row) => row.kind !== "chat").length,
  };
}
