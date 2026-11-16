import { chatStamp, latestByThread, previewText } from "@/lib/match/chat-ui";
import { pickPrimaryPhotoMap, publicMediaUrl } from "@/lib/match/inbox-card";
import { displayFirstName } from "@/lib/profile/options";
import { buildSalonRows, type SalonMsg } from "@/lib/match/salon-thread";

type TicketClient = { from: (table: string) => any };

export type StaffInboxThread = {
  id: string;
  frozen: boolean;
  otherId: string;
  name: string;
  photo: string | null;
  preview: string;
  stamp: string;
};

type ThreadRow = { id: string; profile_a: string; profile_b: string; frozen?: boolean; created_at: string };

async function threadsOwnedBy(db: TicketClient, ids: string[]): Promise<ThreadRow[]> {
  const cols = "id, profile_a, profile_b, frozen, created_at";
  const hits = await Promise.all(
    ids.flatMap((id) => [
      db.from("threads").select(cols).eq("profile_a", id),
      db.from("threads").select(cols).eq("profile_b", id),
    ]),
  );
  const seen = new Set<string>();
  const open: ThreadRow[] = [];
  for (const hit of hits) {
    for (const thread of (hit.data ?? []) as ThreadRow[]) {
      if (!thread?.id || seen.has(thread.id)) continue;
      seen.add(thread.id);
      open.push(thread);
    }
  }
  open.sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
  return open;
}

export async function loadStaffInbox(
  db: TicketClient,
  profileId: string,
): Promise<{ myIds: string[]; threads: StaffInboxThread[] }> {
  const myIds = [profileId];
  const open = await threadsOwnedBy(db, myIds);
  const otherIds = [
    ...new Set(
      open.map((thread: { profile_a: string; profile_b: string }) =>
        myIds.includes(thread.profile_a) ? thread.profile_b : thread.profile_a,
      ),
    ),
  ];
  const [{ data: names }, { data: msgs }, photoRows] = await Promise.all([
    otherIds.length
      ? db.from("profiles").select("id, subject_full_name").in("id", otherIds)
      : Promise.resolve({ data: [] }),
    open.length
      ? db
          .from("messages")
          .select("thread_id, body, created_at, deleted_at")
          .in(
            "thread_id",
            open.map((thread: { id: string }) => thread.id),
          )
          .order("created_at", { ascending: false })
          .limit(400)
      : Promise.resolve({ data: [] }),
    otherIds.length
      ? db
          .from("media")
          .select("profile_id, storage_path, created_at, is_primary")
          .eq("kind", "photo")
          .in("profile_id", otherIds)
          .order("created_at")
          .then((first: { error?: unknown; data?: unknown[] }) =>
            first.error
              ? db
                  .from("media")
                  .select("profile_id, storage_path")
                  .eq("kind", "photo")
                  .in("profile_id", otherIds)
                  .then((row: { data?: unknown[] }) => row.data ?? [])
              : (first.data ?? []),
          )
      : Promise.resolve([]),
  ]);

  const nameMap = new Map<string, { subject_full_name?: string | null }>(
    (names ?? []).map((row: { id: string; subject_full_name?: string | null }) => [row.id, row]),
  );
  const lastMap = latestByThread(
    (msgs ?? []) as { thread_id: string; created_at: string; body?: string | null; deleted_at?: string | null }[],
  );
  const photoMap = pickPrimaryPhotoMap(photoRows as never);

  return {
    myIds,
    threads: open.map((thread: { id: string; profile_a: string; profile_b: string; frozen?: boolean; created_at: string }) => {
      const otherId = myIds.includes(thread.profile_a) ? thread.profile_b : thread.profile_a;
      const name = displayFirstName(nameMap.get(otherId)?.subject_full_name ?? "Match");
      const last = lastMap.get(thread.id);
      return {
        id: thread.id,
        frozen: Boolean(thread.frozen),
        otherId,
        name,
        photo: publicMediaUrl(photoMap.get(otherId)),
        preview: previewText(last?.deleted_at ? "" : last?.body),
        stamp: chatStamp(last?.created_at || thread.created_at),
      };
    }),
  };
}

export async function loadStaffThread(
  db: TicketClient,
  threadId: string,
  myIds: string[],
): Promise<{
  myProfileId: string;
  peerName: string;
  peerPhoto: string | null;
  frozen: boolean;
  rows: ReturnType<typeof buildSalonRows>;
} | null> {
  const { data: thread } = await db
    .from("threads")
    .select("id, profile_a, profile_b, frozen")
    .eq("id", threadId)
    .maybeSingle();
  if (!thread) return null;
  const mine = myIds.includes(thread.profile_a)
    ? thread.profile_a
    : myIds.includes(thread.profile_b)
      ? thread.profile_b
      : thread.profile_a;
  const otherId = mine === thread.profile_a ? thread.profile_b : thread.profile_a;
  const [{ data: other }, { data: msgs }, { data: photos }] = await Promise.all([
    db.from("profiles").select("subject_full_name").eq("id", otherId).maybeSingle(),
    db
      .from("messages")
      .select("id, sender_profile_id, body, created_at, read_at, edited_at, deleted_at")
      .eq("thread_id", threadId)
      .order("created_at", { ascending: true })
      .limit(250),
    db.from("media").select("storage_path, is_primary").eq("profile_id", otherId).eq("kind", "photo").order("created_at"),
  ]);
  const messages = (msgs ?? []) as SalonMsg[];
  const peerName = displayFirstName(other?.subject_full_name ?? "Match");
  const primary = (photos ?? []).find((row: { is_primary?: boolean }) => row.is_primary) ?? (photos ?? [])[0];
  return {
    myProfileId: mine,
    peerName,
    peerPhoto: publicMediaUrl(primary?.storage_path),
    frozen: Boolean(thread.frozen),
    rows: buildSalonRows(messages, mine, peerName),
  };
}
