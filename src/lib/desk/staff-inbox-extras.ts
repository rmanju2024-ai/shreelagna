import type { InboxNote } from "@/app/app/interests/inbox-board";
import { alertHeadline } from "@/lib/match/alert-copy";
import { collapseNotices } from "@/lib/match/collapse-notices";
import { pickPrimaryPhotoMap, publicMediaUrl } from "@/lib/match/inbox-card";
import { yearsFromDob } from "@/lib/profile/completeness";
import { isMissingColumnError } from "@/lib/profile/db-errors";
import { nestedName } from "@/lib/desk/look-cards";
import {
  effectiveInterestStatus,
  formatInboxWhen,
  interestStatusLabel,
  isHistoryStatus,
} from "@/lib/match/interest-status";
import { formatHeightImperial } from "@/lib/profile/match-compare";
import { displayFirstName } from "@/lib/profile/options";
type Db = { from: (table: string) => any };

export type StaffAlert = {
  id: string;
  kind: string;
  title: string | null;
  body: string | null;
  href: string | null;
  created_at: string;
  read_at: string | null;
  match_profile_id: string | null;
  photo: string | null;
};

export async function loadStaffLikes(db: Db, profileId: string): Promise<{
  received: InboxNote[];
  sent: InboxNote[];
  accepted: InboxNote[];
  history: InboxNote[];
  viewed: InboxNote[];
  visited: InboxNote[];
  pendingCount: number;
}> {
  const empty = { received: [], sent: [], accepted: [], history: [], viewed: [], visited: [], pendingCount: 0 };
  const ids = profileId ? [profileId] : [];
  if (!ids.length) return empty;
  const idSet = new Set(ids);

  const [{ data: rec }, { data: sen }, { data: views }, { data: visits }] = await Promise.all([
    db.from("interests").select("id, created_at, from_profile_id, to_profile_id, status").in("to_profile_id", ids).order("created_at", { ascending: false }),
    db.from("interests").select("id, created_at, from_profile_id, to_profile_id, status").in("from_profile_id", ids).order("created_at", { ascending: false }),
    db.from("profile_views").select("viewer_profile_id, viewed_profile_id, viewed_at").in("viewed_profile_id", ids).order("viewed_at", { ascending: false }).limit(30),
    db.from("profile_views").select("viewer_profile_id, viewed_profile_id, viewed_at").in("viewer_profile_id", ids).order("viewed_at", { ascending: false }).limit(30),
  ]);

  const received = rec ?? [];
  const sent = sen ?? [];
  const other = (a: string, b: string) => (idSet.has(a) ? b : a);
  const otherIds = [
    ...new Set(
      [
        ...received.map((row: { from_profile_id: string; to_profile_id: string }) => other(row.from_profile_id, row.to_profile_id)),
        ...sent.map((row: { from_profile_id: string; to_profile_id: string }) => other(row.from_profile_id, row.to_profile_id)),
        ...(views ?? []).map((row: { viewer_profile_id: string }) => row.viewer_profile_id),
        ...(visits ?? []).map((row: { viewed_profile_id: string }) => row.viewed_profile_id),
      ].filter(Boolean),
    ),
  ];
  const profileSelect =
    "id, subject_full_name, status, date_of_birth, height_cm, current_city, current_state, native_state, qualification, occupation, religions(name), communities(name)";
  let names: { data: Record<string, unknown>[] | null } = { data: [] };
  if (otherIds.length) {
    const full = await db.from("profiles").select(profileSelect).in("id", otherIds);
    names =
      full.error
        ? await db
            .from("profiles")
            .select("id, subject_full_name, status, date_of_birth, height_cm, current_city, current_state, qualification, occupation")
            .in("id", otherIds)
        : full;
  }
  const nameMap = new Map<string, Record<string, unknown>>(
    (names.data ?? []).map((row) => [String(row.id), row]),
  );
  const { data: photos } = otherIds.length
    ? await db.from("media").select("profile_id, storage_path, is_primary").eq("kind", "photo").in("profile_id", otherIds)
    : { data: [] };
  const photoMap = pickPrimaryPhotoMap(photos ?? []);
  const photoLists = new Map<string, string[]>();
  for (const row of photos ?? []) {
    const path = String(row.storage_path ?? "").trim();
    if (!path) continue;
    const list = photoLists.get(row.profile_id) ?? [];
    if (!list.includes(path)) list.push(path);
    photoLists.set(row.profile_id, list);
  }

  function note(
    id: string,
    profileId: string,
    when: string,
    status?: string,
  ): InboxNote {
    const row = nameMap.get(profileId);
    const age = typeof row?.date_of_birth === "string" ? yearsFromDob(row.date_of_birth) : null;
    const height = typeof row?.height_cm === "number" ? formatHeightImperial(row.height_cm) : null;
    const urls = (photoLists.get(profileId) ?? [])
      .map((path) => publicMediaUrl(path))
      .filter((url): url is string => Boolean(url));
    const primary = publicMediaUrl(photoMap.get(profileId)) ?? urls[0] ?? null;
    return {
      id,
      name: displayFirstName(String(row?.subject_full_name ?? "Removed profile")),
      when: formatInboxWhen(when),
      profileId,
      status,
      photoUrl: primary,
      photoUrls: urls.length ? urls : primary ? [primary] : [],
      age: age != null ? `${age} yrs` : null,
      height,
      religion: nestedName(row?.religions),
      community: nestedName(row?.communities),
      city: typeof row?.current_city === "string" ? row.current_city : null,
      state: typeof row?.current_state === "string" ? row.current_state : typeof row?.native_state === "string" ? row.native_state : null,
      education: typeof row?.qualification === "string" ? row.qualification : null,
      occupation: typeof row?.occupation === "string" ? row.occupation : null,
      lastOnline: row?.status && row.status !== "active" ? String(row.status).replace(/_/g, " ") : undefined,
    };
  }

  function statusOf(row: { status?: string | null; created_at: string; from_profile_id: string; to_profile_id: string }) {
    return effectiveInterestStatus(row.status, row.created_at);
  }

  const live = [...received, ...sent];
  const pendingIn = received.filter((row: { status?: string | null; created_at: string; from_profile_id: string; to_profile_id: string }) => statusOf(row) === "pending");
  const pendingOut = sent.filter((row: { status?: string | null; created_at: string; from_profile_id: string; to_profile_id: string }) => statusOf(row) === "pending");
  const accepted = live.filter((row: { status?: string | null; created_at: string; from_profile_id: string; to_profile_id: string }) => statusOf(row) === "accepted");
  const history = live.filter((row: { status?: string | null; created_at: string; from_profile_id: string; to_profile_id: string }) => isHistoryStatus(statusOf(row)));

  return {
    received: pendingIn.map((row: { id: string; created_at: string; from_profile_id: string; to_profile_id: string; status?: string | null }) =>
      note(row.id, other(row.from_profile_id, row.to_profile_id), row.created_at, interestStatusLabel(statusOf(row))),
    ),
    sent: pendingOut.map((row: { id: string; created_at: string; from_profile_id: string; to_profile_id: string; status?: string | null }) =>
      note(row.id, other(row.from_profile_id, row.to_profile_id), row.created_at, interestStatusLabel(statusOf(row))),
    ),
    accepted: accepted.map((row: { id: string; created_at: string; from_profile_id: string; to_profile_id: string; status?: string | null }) =>
      note(row.id, other(row.from_profile_id, row.to_profile_id), row.created_at, interestStatusLabel(statusOf(row))),
    ),
    history: history.map((row: { id: string; created_at: string; from_profile_id: string; to_profile_id: string; status?: string | null }) =>
      note(row.id, other(row.from_profile_id, row.to_profile_id), row.created_at, interestStatusLabel(statusOf(row))),
    ),
    viewed: (views ?? []).map((row: { viewer_profile_id: string; viewed_at: string }, i: number) =>
      note(`view-${i}-${row.viewer_profile_id}`, row.viewer_profile_id, row.viewed_at),
    ),
    visited: (visits ?? []).map((row: { viewed_profile_id: string; viewed_at: string }, i: number) =>
      note(`visit-${i}-${row.viewed_profile_id}`, row.viewed_profile_id, row.viewed_at),
    ),
    pendingCount: pendingIn.length,
  };
}

export async function loadStaffAlerts(
  db: Db,
  ownerId: string,
  profileId?: string | null,
): Promise<{ alerts: StaffAlert[]; unread: number }> {
  if (!ownerId) return { alerts: [], unread: 0 };
  const full = await db
    .from("notices")
    .select("id, kind, title, body, href, created_at, read_at, match_profile_id, for_profile_id")
    .eq("user_id", ownerId)
    .neq("kind", "chat")
    .order("created_at", { ascending: false })
    .limit(80);
  const notices =
    full.error && isMissingColumnError(full.error, "for_profile_id")
      ? await db
          .from("notices")
          .select("id, kind, title, body, href, created_at, read_at, match_profile_id")
          .eq("user_id", ownerId)
          .neq("kind", "chat")
          .order("created_at", { ascending: false })
          .limit(80)
      : full;
  const rows = (notices.data ?? []) as {
    id: string;
    kind: string;
    title?: string | null;
    body?: string | null;
    href?: string | null;
    created_at: string;
    read_at?: string | null;
    match_profile_id?: string | null;
    for_profile_id?: string | null;
  }[];
  const scoped = profileId
    ? rows.filter((row) => !row.for_profile_id || row.for_profile_id === profileId)
    : rows;
  const collapsed = collapseNotices(scoped);
  const profileIds = [...new Set(collapsed.map((row) => row.match_profile_id).filter(Boolean))] as string[];
  const { data: photos } = profileIds.length
    ? await db.from("media").select("profile_id, storage_path").eq("kind", "photo").eq("status", "approved").in("profile_id", profileIds)
    : { data: [] };
  const photoMap = new Map<string, string>();
  for (const row of photos ?? []) {
    if (!photoMap.has(row.profile_id) && row.storage_path) photoMap.set(row.profile_id, row.storage_path);
  }
  return {
    unread: collapsed.filter((row) => !row.read_at).length,
    alerts: collapsed.map((row) => ({
      id: String(row.id),
      kind: String(row.kind ?? "general"),
      title: row.title ?? null,
      body: row.body ?? null,
      href: row.href ?? null,
      created_at: String(row.created_at),
      read_at: row.read_at ?? null,
      match_profile_id: row.match_profile_id ?? null,
      photo: publicMediaUrl(photoMap.get(row.match_profile_id ?? "") ?? null),
    })),
  };
}

export { alertHeadline };
