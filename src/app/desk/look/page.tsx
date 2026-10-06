import { DeskLookBoard } from "@/app/desk/look/desk-look-board";
import type { BrowseCardNote } from "@/app/browse/browse-card";
import { fetchAdminUserIds, ownerIsAdmin } from "@/lib/desk/admin-ids";
import { requireDesk } from "@/lib/desk/access";
import { inboxLastOnline, publicMediaUrl } from "@/lib/match/inbox-card";
import { BROWSE_PROFILE_SELECT, BROWSE_PROFILE_SELECT_STAR, loadBrowsePhotoMap } from "@/lib/match/browse-query";
import { yearsFromDob } from "@/lib/profile/completeness";
import { loadFaithCatalog } from "@/lib/profile/load-form-lists";
import { formatHeightImperial } from "@/lib/profile/match-compare";
import { displayFirstName } from "@/lib/profile/options";
import { createServiceClient } from "@/lib/supabase/server";

const LOOK_LIST_LIMIT = 200;
const LOOK_STATUSES = ["active", "pending_review", "on_hold", "hidden"];

function nestedName(value: unknown): string | null {
  if (Array.isArray(value) && value[0] && typeof value[0] === "object" && value[0] && "name" in value[0]) {
    return String((value[0] as { name: unknown }).name);
  }
  if (value && typeof value === "object" && "name" in value) {
    return String((value as { name: unknown }).name);
  }
  return null;
}

function asText(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

function statusLine(status: string | null): string {
  if (status === "pending_review") return "In review";
  if (status === "on_hold") return "Paused";
  if (status === "hidden") return "Hidden";
  return "";
}

function cardFromRow(row: Record<string, unknown>, photoMap: Map<string, string>, now: number): BrowseCardNote {
  const status = asText(row.status);
  const community = nestedName(row.communities);
  const age = typeof row.date_of_birth === "string" ? yearsFromDob(row.date_of_birth) : null;
  const height = typeof row.height_cm === "number" ? formatHeightImperial(row.height_cm) : null;
  return {
    id: String(row.id),
    href: `/browse/${row.id}`,
    name: displayFirstName(typeof row.subject_full_name === "string" ? row.subject_full_name : "Profile"),
    photoUrl: publicMediaUrl(photoMap.get(String(row.id))),
    lastOnline:
      status === "active"
        ? inboxLastOnline(
            Boolean(row.hide_last_seen),
            typeof row.last_seen_at === "string" ? row.last_seen_at : null,
            now,
            "active",
          )
        : statusLine(status),
    age: age != null ? `${age} yrs` : null,
    height,
    religion: nestedName(row.religions),
    community,
    city: asText(row.current_city),
    state: asText(row.current_state) || asText(row.native_state),
    education: asText(row.qualification),
    occupation: asText(row.occupation),
    date_of_birth: asText(row.date_of_birth),
    current_country: asText(row.current_country),
    diet: asText(row.diet),
    income_band: asText(row.income_band),
    profile_type: asText(row.profile_type),
    score: null,
  };
}

export default async function DeskLookPage() {
  const desk = await requireDesk("/desk/look");
  if (!desk.allowed) return null;
  const db = createServiceClient() ?? desk.supabase;
  const faithPromise = loadFaithCatalog();
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
    listQuery(BROWSE_PROFILE_SELECT).then((result) => (result.error ? listQuery(BROWSE_PROFILE_SELECT_STAR) : result)),
    desk.admin ? Promise.resolve(new Set<string>()) : fetchAdminUserIds(db as never),
    faithPromise,
  ]);

  const rows = (listData.data ?? []).filter(
    (row) => desk.admin || !ownerIsAdmin(row.created_by, adminIds),
  );
  const photoMap = await loadBrowsePhotoMap(
    db,
    rows.map((row) => String(row.id)),
  );
  const now = Date.now();
  const notes = rows.map((row) => cardFromRow(row, photoMap, now));

  return (
    <DeskLookBoard
      notes={notes}
      religions={[...new Set(faith.religions.map((row) => row.name).filter(Boolean))]}
      communities={[...new Set(faith.communities.map((row) => row.name).filter(Boolean))]}
    />
  );
}
