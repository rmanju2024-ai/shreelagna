import { DeskLookBoard } from "@/app/desk/look/desk-look-board";
import { fetchAdminUserIds, ownerIsAdmin } from "@/lib/desk/admin-ids";
import { requireDesk } from "@/lib/desk/access";
import { lookCardFromRow, LOOK_LIST_LIMIT, LOOK_STATUSES, subscribedOwnerIds } from "@/lib/desk/look-cards";
import { LOOK_PROFILE_SELECT, BROWSE_PROFILE_SELECT_STAR, loadBrowsePhotoMap } from "@/lib/match/browse-query";
import { loadFaithCatalog } from "@/lib/profile/load-form-lists";
import { createServiceClient } from "@/lib/supabase/server";

export default async function DeskLookPage() {
  const desk = await requireDesk("/desk/look");
  if (!desk.allowed) return null;
  const db = createServiceClient() ?? desk.supabase;
  const listQuery = async (cols: string) => {
    const result = await db
      .from("profiles")
      .select(cols)
      .in("status", LOOK_STATUSES)
      .order("updated_at", { ascending: false })
      .limit(LOOK_LIST_LIMIT);
    return result as { data: Record<string, unknown>[] | null; error: { message?: string } | null };
  };

  const [listData, adminIds, faith] = await Promise.all([
    listQuery(LOOK_PROFILE_SELECT).then((result) => (result.error ? listQuery(BROWSE_PROFILE_SELECT_STAR) : result)),
    desk.admin ? Promise.resolve(new Set<string>()) : fetchAdminUserIds(db as never),
    loadFaithCatalog(),
  ]);

  const rows = (listData.data ?? []).filter((row) => desk.admin || !ownerIsAdmin(row.created_by, adminIds));
  const ownerIds = [...new Set(rows.map((row) => String(row.created_by ?? "")).filter(Boolean))];
  const ids = rows.map((row) => String(row.id));
  const [paidResult, photoMap] = await Promise.all([
    (async () => {
      if (!ownerIds.length) return { data: [] as { user_id?: string | null; ends_at?: string | null }[] };
      return (await db
        .from("memberships")
        .select("user_id, status, ends_at")
        .eq("status", "active")
        .in("user_id", ownerIds)) as unknown as {
        data: { user_id?: string | null; ends_at?: string | null }[] | null;
      };
    })(),
    loadBrowsePhotoMap(db, ids),
  ]);
  const subscribedOwners = subscribedOwnerIds(paidResult.data ?? []);
  const now = Date.now();
  const notes = rows.map((row) =>
    lookCardFromRow({ ...row, subscribed: subscribedOwners.has(String(row.created_by ?? "")) }, photoMap, now),
  );

  return (
    <DeskLookBoard
      notes={notes}
      religions={[...new Set(faith.religions.map((row) => row.name).filter(Boolean))]}
      communities={[...new Set(faith.communities.map((row) => row.name).filter(Boolean))]}
    />
  );
}
