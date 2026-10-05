import { loadBlockedProfileIds } from "@/lib/safety/blocked";
import { collapseNotices, noticesForActiveProfiles } from "@/lib/match/collapse-notices";
import { pairCanChat } from "@/lib/match/interest-status";
import { createServiceClient } from "@/lib/supabase/server";

type Thread = { id: string; profile_a: string; profile_b: string };
type Pair = { from_profile_id: string; to_profile_id: string; status: string; created_at: string };

/** Header badge counts. Queries run in three parallel stages instead of six sequential ones. */
export async function unreadNoticeBadge(userId: string) {
  const db = createServiceClient();
  if (!db) return { chatUnread: 0, alertUnread: 0 };

  // Stage 1: unread notices and the member's own profiles, together.
  const [noticeResult, ownResult] = await Promise.all([
    db
      .from("notices")
      .select("id, kind, href, match_profile_id, created_at")
      .eq("user_id", userId)
      .is("read_at", null)
      .order("created_at", { ascending: false })
      .limit(80),
    db.from("profiles").select("id").eq("created_by", userId),
  ]);
  if (noticeResult.error) throw noticeResult.error;
  if (ownResult.error) throw ownResult.error;
  const collapsed = collapseNotices(noticeResult.data ?? []);
  const profileIds = [...new Set(collapsed.map((row) => row.match_profile_id).filter(Boolean))] as string[];
  const ownIds = (ownResult.data ?? []).map((profile) => profile.id);
  const ownList = ownIds.join(",");

  // Stage 2: everything that depends only on stage 1.
  const [activeResult, threadResult, pairResult] = await Promise.all([
    profileIds.length
      ? db.from("profiles").select("id").in("id", profileIds).eq("status", "active")
      : Promise.resolve({ data: [] as { id: string }[], error: null }),
    ownIds.length
      ? db.from("threads").select("id, profile_a, profile_b").or(`profile_a.in.(${ownList}),profile_b.in.(${ownList})`)
      : Promise.resolve({ data: [] as Thread[], error: null }),
    ownIds.length
      ? db
          .from("interests")
          .select("from_profile_id, to_profile_id, status, created_at")
          .or(`from_profile_id.in.(${ownList}),to_profile_id.in.(${ownList})`)
      : Promise.resolve({ data: [] as Pair[], error: null }),
  ]);
  if (activeResult.error) throw activeResult.error;
  if (threadResult.error) throw threadResult.error;
  if (pairResult.error) throw pairResult.error;
  const blocked = await loadBlockedProfileIds(db, ownIds);
  const open = noticesForActiveProfiles(
    collapsed,
    new Set((activeResult.data ?? []).map((row) => row.id).filter((id) => !blocked.has(id))),
  );
  const threads = (threadResult.data ?? []) as Thread[];

  // Stage 3: status of the people on the other side of each thread.
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
        return otherStatus.get(other) === "active" && !blocked.has(other) && pairCanChat((pairResult.data ?? []) as Pair[], thread.profile_a, thread.profile_b);
      })
      .map((thread) => `/app/chat/${thread.id}`),
  );
  return {
    chatUnread: open.filter((row) => row.kind === "chat" && visibleChatHrefs.has(row.href ?? "")).length,
    alertUnread: open.filter((row) => row.kind !== "chat").length,
  };
}
