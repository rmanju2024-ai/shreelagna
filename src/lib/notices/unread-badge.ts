import { unstable_cache } from "next/cache";
import { collapseNotices } from "@/lib/match/collapse-notices";
import { createServiceClient } from "@/lib/supabase/server";

export const unreadNoticeBadge = (userId: string) =>
  unstable_cache(
    async () => {
      const db = createServiceClient();
      if (!db) return { chatUnread: 0, alertUnread: 0 };
      const { data } = await db
        .from("notices")
        .select("id, kind, match_profile_id, created_at")
        .eq("user_id", userId)
        .is("read_at", null)
        .order("created_at", { ascending: false })
        .limit(80);
      const open = collapseNotices(data ?? []);
      return {
        chatUnread: open.filter((row) => row.kind === "chat").length,
        alertUnread: open.filter((row) => row.kind !== "chat").length,
      };
    },
    ["notice-badge", userId],
    { revalidate: 20, tags: ["notices", `notices-${userId}`] },
  )();
