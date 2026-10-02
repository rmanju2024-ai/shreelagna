import { collapseNotices, noticesForActiveProfiles } from "@/lib/match/collapse-notices";
import { pairCanChat } from "@/lib/match/interest-status";
import { createServiceClient } from "@/lib/supabase/server";

export async function unreadNoticeBadge(userId: string) {
  const db = createServiceClient();
  if (!db) return { chatUnread: 0, alertUnread: 0 };
  const { data, error } = await db
    .from("notices")
    .select("id, kind, href, match_profile_id, created_at")
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
  const ownResult = await db.from("profiles").select("id").eq("created_by", userId);
  if (ownResult.error) throw ownResult.error;
  const ownIds = (ownResult.data ?? []).map((profile) => profile.id);
  const threadResult = ownIds.length
    ? await db
        .from("threads")
        .select("id, profile_a, profile_b")
        .or(`profile_a.in.(${ownIds.join(",")}),profile_b.in.(${ownIds.join(",")})`)
    : { data: [] as { id: string; profile_a: string; profile_b: string }[], error: null };
  if (threadResult.error) throw threadResult.error;
  const threads = threadResult.data ?? [];
  const pairResult = ownIds.length
    ? await db
        .from("interests")
        .select("from_profile_id, to_profile_id, status, created_at")
        .or(`from_profile_id.in.(${ownIds.join(",")}),to_profile_id.in.(${ownIds.join(",")})`)
    : { data: [] as { from_profile_id: string; to_profile_id: string; status: string; created_at: string }[], error: null };
  if (pairResult.error) throw pairResult.error;
  const otherIds = [...new Set(threads.map((thread) => (ownIds.includes(thread.profile_a) ? thread.profile_b : thread.profile_a)))];
  const othersResult = otherIds.length
    ? await db.from("profiles").select("id, status").in("id", otherIds)
    : { data: [] as { id: string; status: string }[], error: null };
  if (othersResult.error) throw othersResult.error;
  const otherStatus = new Map((othersResult.data ?? []).map((profile) => [profile.id, profile.status]));
  const visibleChatHrefs = new Set(
    threads
      .filter((thread) => {
        const other = ownIds.includes(thread.profile_a) ? thread.profile_b : thread.profile_a;
        return otherStatus.get(other) === "active" && pairCanChat(pairResult.data ?? [], thread.profile_a, thread.profile_b);
      })
      .map((thread) => `/app/chat/${thread.id}`),
  );
  return {
    chatUnread: open.filter((row) => row.kind === "chat" && visibleChatHrefs.has(row.href ?? "")).length,
    alertUnread: open.filter((row) => row.kind !== "chat").length,
  };
}
