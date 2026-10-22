import { DeskLookBoard } from "@/app/desk/look/desk-look-board";
import { fetchAdminUserIds, ownerIsAdmin } from "@/lib/desk/admin-ids";
import { requireDesk } from "@/lib/desk/access";
import { lookCardFromRow, LOOK_LIST_LIMIT, LOOK_STATUSES, subscribedOwnerIds } from "@/lib/desk/look-cards";
import { planByCode } from "@/lib/membership/catalog";
import { fetchPlans } from "@/lib/membership/load";
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

  const [listData, adminIds, faith, catalog] = await Promise.all([
    listQuery(LOOK_PROFILE_SELECT).then((result) => (result.error ? listQuery(BROWSE_PROFILE_SELECT_STAR) : result)),
    desk.admin ? Promise.resolve(new Set<string>()) : fetchAdminUserIds(db as never),
    loadFaithCatalog(),
    fetchPlans(db),
  ]);

  const rows = (listData.data ?? []).filter((row) => desk.admin || !ownerIsAdmin(row.created_by, adminIds));
  const ownerIds = [...new Set(rows.map((row) => String(row.created_by ?? "")).filter(Boolean))];
  const ids = rows.map((row) => String(row.id));
  const [paidResult, photoMap] = await Promise.all([
    (async () => {
      if (!ownerIds.length) return { data: [] as { user_id?: string | null; ends_at?: string | null }[] };
      return (await db
        .from("memberships")
        .select("user_id, status, ends_at, plan_code")
        .eq("status", "active")
        .in("user_id", ownerIds)) as unknown as {
        data: { user_id?: string | null; ends_at?: string | null; plan_code?: string | null }[] | null;
      };
    })(),
    loadBrowsePhotoMap(db, ids),
  ]);
  const paidRows = paidResult.data ?? [];
  const subscribedOwners = subscribedOwnerIds(paidRows);
  const planByOwner = new Map<string, string>();
  for (const row of paidRows) {
    const owner = String(row.user_id ?? "");
    if (!owner || planByOwner.has(owner)) continue;
    const plan = planByCode(row.plan_code, catalog);
    planByOwner.set(owner, plan?.name ?? "Paid plan");
  }
  const now = Date.now();
  const notes = rows.map((row) =>
    lookCardFromRow(
      {
        ...row,
        subscribed: subscribedOwners.has(String(row.created_by ?? "")),
        plan_name: planByOwner.get(String(row.created_by ?? "")) ?? null,
      },
      photoMap,
      now,
    ),
  );

  return (
    <DeskLookBoard
      notes={notes}
      religions={[...new Set(faith.religions.map((row) => row.name).filter(Boolean))]}
      communities={[...new Set(faith.communities.map((row) => row.name).filter(Boolean))]}
    />
  );
}
