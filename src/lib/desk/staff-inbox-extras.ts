import type { InboxNote } from "@/app/app/interests/inbox-board";
import { alertHeadline } from "@/lib/match/alert-copy";
import { collapseNotices } from "@/lib/match/collapse-notices";
import { pickPrimaryPhotoMap, publicMediaUrl } from "@/lib/match/inbox-card";
import {
  effectiveInterestStatus,
  formatInboxWhen,
  interestStatusLabel,
  isHistoryStatus,
} from "@/lib/match/interest-status";
import { displayFirstName } from "@/lib/profile/options";
import { isListedProfileStatus } from "@/lib/profile/visibility";

type Db = { from: (table: string) => any };

export type StaffAlert = {
  id: string;
  kind: string;
  title: string | null;
  body: string | null;
  created_at: string;
  read_at: string | null;
  match_profile_id: string | null;
  photo: string | null;
};

export async function loadStaffLikes(db: Db, ownerId: string): Promise<{
  received: InboxNote[];
  sent: InboxNote[];
  accepted: InboxNote[];
  history: InboxNote[];
  viewed: InboxNote[];
  visited: InboxNote[];
  pendingCount: number;
}> {
  const empty = { received: [], sent: [], accepted: [], history: [], viewed: [], visited: [], pendingCount: 0 };
  if (!ownerId) return empty;
  const { data: mine } = await db.from("profiles").select("id").eq("created_by", ownerId);
  const ids = (mine ?? []).map((row: { id: string }) => String(row.id));
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
  const { data: names } = otherIds.length
    ? await db.from("profiles").select("id, subject_full_name, status").in("id", otherIds)
    : { data: [] };
  const nameMap = new Map<string, { subject_full_name?: string | null; status?: string | null }>(
    (names ?? []).map((row: { id: string; subject_full_name?: string | null; status?: string | null }) => [row.id, row]),
  );
  const { data: photos } = otherIds.length
    ? await db.from("media").select("profile_id, storage_path, is_primary").eq("kind", "photo").eq("status", "approved").in("profile_id", otherIds)
    : { data: [] };
  const photoMap = pickPrimaryPhotoMap(photos ?? []);

  function note(
    id: string,
    profileId: string,
    when: string,
    status?: string,
  ): InboxNote {
    const row = nameMap.get(profileId);
    return {
      id,
      name: displayFirstName(row?.subject_full_name ?? "Removed profile"),
      when: formatInboxWhen(when),
      profileId,
      status,
      photoUrl: row && isListedProfileStatus(row.status) ? publicMediaUrl(photoMap.get(profileId)) : null,
    };
  }

  function statusOf(row: { status?: string | null; created_at: string; from_profile_id: string; to_profile_id: string }) {
    const who = nameMap.get(other(row.from_profile_id, row.to_profile_id));
    if (!who || !isListedProfileStatus(who.status)) return "deleted" as const;
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

export async function loadStaffAlerts(db: Db, ownerId: string): Promise<{ alerts: StaffAlert[]; unread: number }> {
  if (!ownerId) return { alerts: [], unread: 0 };
  const { data: notices } = await db
    .from("notices")
    .select("id, kind, title, body, href, created_at, read_at, match_profile_id")
    .eq("user_id", ownerId)
    .neq("kind", "chat")
    .order("created_at", { ascending: false })
    .limit(50);
  const collapsed = collapseNotices(
    (notices ?? []) as {
      id: string;
      kind: string;
      title?: string | null;
      body?: string | null;
      created_at: string;
      read_at?: string | null;
      match_profile_id?: string | null;
    }[],
  );
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
      created_at: String(row.created_at),
      read_at: row.read_at ?? null,
      match_profile_id: row.match_profile_id ?? null,
      photo: publicMediaUrl(photoMap.get(row.match_profile_id ?? "") ?? null),
    })),
  };
}

export { alertHeadline };
