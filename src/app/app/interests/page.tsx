import { BackToAccount } from "@/components/back-to-account";
import Link from "next/link";
import { InboxSwitcher } from "@/components/inbox-switcher";
import { LikesSeen } from "@/components/likes-seen";
import { InboxBoard } from "@/app/app/interests/inbox-board";
import { SECTIONS, type SectionId } from "@/lib/match/likes-sections";
import { expireStaleInterests } from "@/app/app/match/actions";
import { InnerShell as PageShell } from "@/components/chrome-layout";
import { ensureAppUser, getAuth } from "@/lib/auth/session";
import {
  effectiveInterestStatus,
  formatInboxWhen,
  interestStatusLabel,
  isHistoryStatus,
  type InterestStatus,
} from "@/lib/match/interest-status";
import { inboxLastOnlineNow, pickPrimaryPhotoMap, publicMediaUrl } from "@/lib/match/inbox-card";
import { yearsFromDob } from "@/lib/profile/completeness";
import { formatHeightImperial } from "@/lib/profile/match-compare";
import { displayFirstName } from "@/lib/profile/options";
import { isPublicProfileStatus } from "@/lib/profile/visibility";
import { createServiceClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

function nestedName(value: unknown): string | null {
  if (Array.isArray(value) && value[0] && typeof value[0] === "object" && "name" in value[0]) {
    return String((value[0] as { name: unknown }).name);
  }
  if (value && typeof value === "object" && "name" in value) {
    return String((value as { name: unknown }).name);
  }
  return null;
}

type ProfileSnap = {
  id: string;
  subject_full_name: string | null;
  status?: string | null;
  date_of_birth?: string | null;
  current_city?: string | null;
  current_state?: string | null;
  native_state?: string | null;
  last_seen_at?: string | null;
  hide_last_seen?: boolean | null;
  hide_photo_until_accept?: boolean | null;
  height_cm?: number | null;
  qualification?: string | null;
  occupation?: string | null;
  religions?: unknown;
  communities?: unknown;
};

type InterestRow = {
  id: string;
  created_at: string;
  from_profile_id: string;
  to_profile_id: string;
  status?: string | null;
  decline_reason?: string | null;
};

export default async function InterestsPage() {
  return <InterestsView />;
}

export async function InterestsView({ only }: { only?: SectionId } = {}) {
  const { supabase, user } = await getAuth();
  if (!supabase || !user) redirect("/login?next=/app/interests");
  const me = await ensureAppUser(supabase, user);
  if (!me) redirect("/login?error=account");

  const [, { data: mine }] = await Promise.all([
    expireStaleInterests(),
    supabase.from("profiles").select("id, subject_full_name").eq("created_by", me.id),
  ]);
  const ids = (mine ?? []).map((p) => p.id);
  const idSet = new Set(ids);

  // Start every query that only needs this member's profile ids now, so they run together.
  type ViewRow = { viewer_profile_id: string; viewed_profile_id: string; viewed_at: string };
  const archivedPromise = supabase
    .from("interest_archive")
    .select("id, from_profile_id, to_profile_id, from_user_id, to_user_id, from_name, to_name, status, created_at, closed_at")
    .or(`from_user_id.eq.${me.id},to_user_id.eq.${me.id}`)
    .order("closed_at", { ascending: false });
  const viewsPromise = ids.length
    ? supabase.from("profile_views").select("viewer_profile_id, viewed_profile_id, viewed_at").in("viewed_profile_id", ids).order("viewed_at", { ascending: false }).limit(30)
    : Promise.resolve({ data: [] as ViewRow[] });
  const visitsPromise = ids.length
    ? supabase.from("profile_views").select("viewer_profile_id, viewed_profile_id, viewed_at").in("viewer_profile_id", ids).order("viewed_at", { ascending: false }).limit(30)
    : Promise.resolve({ data: [] as ViewRow[] });

  let received: InterestRow[] = [];
  let sent: InterestRow[] = [];
  if (ids.length) {
    const [rec, sen] = await Promise.all([
      supabase.from("interests").select("id, created_at, from_profile_id, to_profile_id, status, decline_reason").in("to_profile_id", ids).order("created_at", { ascending: false }),
      supabase.from("interests").select("id, created_at, from_profile_id, to_profile_id, status, decline_reason").in("from_profile_id", ids).order("created_at", { ascending: false }),
    ]);
    if (rec.error || sen.error) {
      const rec2 = await supabase.from("interests").select("id, created_at, from_profile_id, to_profile_id").in("to_profile_id", ids);
      const sen2 = await supabase.from("interests").select("id, created_at, from_profile_id, to_profile_id").in("from_profile_id", ids);
      received = rec2.data ?? [];
      sent = sen2.data ?? [];
    } else {
      received = rec.data ?? [];
      sent = sen.data ?? [];
    }
  }

  const [archivedQuery, { data: views }, { data: visits }] = await Promise.all([archivedPromise, viewsPromise, visitsPromise]);
  const archived = archivedQuery.error ? [] : archivedQuery.data;

  const otherIds = [
    ...new Set(
      [
        ...[...received, ...sent].flatMap((i) => [i.from_profile_id, i.to_profile_id]),
        ...(archived ?? []).flatMap((row) => [row.from_profile_id, row.to_profile_id]),
      ].filter((id): id is string => Boolean(id)),
    ),
  ];
  const profileSelect =
    "id, subject_full_name, status, date_of_birth, current_city, current_state, native_state, last_seen_at, hide_last_seen, hide_photo_until_accept, height_cm, qualification, occupation, religions(name), communities(name)";
  const loadProfiles = async (wanted: string[]): Promise<ProfileSnap[]> => {
    if (!wanted.length) return [];
    const rich = await supabase.from("profiles").select(profileSelect).in("id", wanted);
    if (!rich.error) return (rich.data ?? []) as ProfileSnap[];
    const plain = await supabase.from("profiles").select("id, subject_full_name, status").in("id", wanted);
    return (plain.data ?? []) as ProfileSnap[];
  };
  const viewIds = [...new Set([
    ...(views ?? []).map((v) => v.viewer_profile_id),
    ...(visits ?? []).map((v) => v.viewed_profile_id),
  ])];
  // Both profile lookups run together.
  const [names, viewers] = await Promise.all([loadProfiles(otherIds), loadProfiles(viewIds)]);
  const nameMap = new Map(names.map((n) => [n.id, n]));
  const viewerRows = viewers.filter((n) => isPublicProfileStatus(n.status));
  const viewerMap = new Map(viewerRows.map((n) => [n.id, n]));

  const photoIds = [...new Set([...nameMap.keys(), ...viewerMap.keys()])];
  const mediaClient = createServiceClient() ?? supabase;
  let photos: { profile_id: string; storage_path: string | null; is_primary?: boolean | null }[] = [];
  if (photoIds.length) {
    const first = await mediaClient
      .from("media")
      .select("profile_id, storage_path, created_at, is_primary")
      .eq("kind", "photo")
      .eq("status", "approved")
      .in("profile_id", photoIds)
      .order("created_at");
    if (first.error) {
      const retry = await mediaClient.from("media").select("profile_id, storage_path").eq("kind", "photo").eq("status", "approved").in("profile_id", photoIds);
      photos = retry.data ?? [];
    } else {
      photos = first.data ?? [];
    }
  }
  const photoMap = pickPrimaryPhotoMap(photos);

  function otherId(row: InterestRow) {
    return idSet.has(row.to_profile_id) ? row.from_profile_id : row.to_profile_id;
  }

  function rowStatus(row: InterestRow): InterestStatus {
    const other = nameMap.get(otherId(row));
    if (!other || !isPublicProfileStatus(other.status)) return "deleted";
    return effectiveInterestStatus(row.status, row.created_at);
  }

  function publicHref(profileId: string) {
    const other = nameMap.get(profileId) ?? viewerMap.get(profileId);
    if (other && !isPublicProfileStatus(other.status)) return undefined;
    return `/browse/${profileId}`;
  }

  function nameFor(row: InterestRow) {
    const other = nameMap.get(otherId(row));
    return displayFirstName(other?.subject_full_name ?? "Removed profile");
  }

  function cardFor(
    profileId: string,
    extra: {
      id: string;
      when: string;
      whenLabel?: string;
      href?: string;
      status?: string;
      accepted?: boolean;
      interestReceived?: boolean;
      reason?: string | null;
    },
  ) {
    const other = nameMap.get(profileId) ?? viewerMap.get(profileId);
    const publicProfile = Boolean(other && isPublicProfileStatus(other.status));
    const photo = publicProfile ? publicMediaUrl(photoMap.get(profileId) ?? null) : null;
    const age = other?.date_of_birth ? yearsFromDob(other.date_of_birth) : null;
    const height = typeof other?.height_cm === "number" ? formatHeightImperial(other.height_cm) : null;
    const closed = other?.status === "hidden" || other?.status === "deleted" || other?.status === "banned";
    return {
      id: extra.id,
      name: displayFirstName(other?.subject_full_name ?? "Removed profile"),
      when: extra.when,
      whenLabel: extra.whenLabel,
      profileId,
      href: extra.href ?? (closed ? undefined : `/browse/${profileId}`),
      status: extra.status,
      photoUrl: photo,
      lastOnline: inboxLastOnlineNow(
        Boolean(other?.hide_last_seen),
        other?.last_seen_at,
        other?.status ?? "deleted",
      ),
      age: publicProfile && age != null ? `${age} yrs` : null,
      height: publicProfile ? height : null,
      religion: publicProfile ? nestedName(other?.religions) : null,
      community: publicProfile ? nestedName(other?.communities) : null,
      city: publicProfile ? other?.current_city ?? null : null,
      state: publicProfile ? other?.current_state || other?.native_state || null : null,
      education: publicProfile ? other?.qualification ?? null : null,
      occupation: publicProfile ? other?.occupation ?? null : null,
      reason: extra.reason ?? null,
    };
  }

  const live = [...received, ...sent];
  const inbox = received.filter((row) => rowStatus(row) === "pending");
  const sentOpen = sent.filter((row) => rowStatus(row) === "pending");
  const accepted = live.filter((row) => rowStatus(row) === "accepted");
  const liveHistory = live.filter((row) => isHistoryStatus(rowStatus(row)));
  const archivedHistory = (archived ?? []).map((row) => {
    const mineIsFrom = row.from_user_id === me.id;
    const otherProfileId = mineIsFrom ? row.to_profile_id : row.from_profile_id;
    const other = otherProfileId ? nameMap.get(otherProfileId) : undefined;
    const name = displayFirstName((mineIsFrom ? row.to_name : row.from_name) || other?.subject_full_name || "Removed profile");
    return {
      id: row.id,
      name,
      when: formatInboxWhen(row.closed_at || row.created_at),
      status: interestStatusLabel("deleted"),
      lastOnline: inboxLastOnlineNow(
        Boolean(other?.hide_last_seen),
        other?.last_seen_at,
        other?.status ?? "deleted",
      ),
    };
  });
  const history = [
    ...liveHistory.map((i) => ({
      id: i.id,
      name: nameFor(i),
      when: formatInboxWhen(i.created_at),
      status: interestStatusLabel(rowStatus(i)),
    })),
    ...archivedHistory.filter((row) => !liveHistory.some((liveRow) => liveRow.id === row.id)),
  ];

  return (
    <PageShell>
      <div className="sx-stage">{only ? null : <BackToAccount />}
      <div className="inbox-unified"><InboxSwitcher active="likes" /></div>
      <header className="sx-hero">
        <div className="sx-hero-copy">
          <p className="sx-eyebrow">Inbox</p>
          <h1>{only ? SECTIONS.find((item) => item.id === only)?.label ?? "Likes" : "Likes"}</h1>
          {only ? <Link href="/app/interests" className="sx-back-to-discover">← Back to Likes</Link> : null}
        </div>
      </header>
      <LikesSeen />
      <InboxBoard
        only={only}
        received={inbox.map((i) =>
          cardFor(i.from_profile_id, {
            id: i.id,
            when: formatInboxWhen(i.created_at),
            whenLabel: "Received",
            href: publicHref(i.from_profile_id),
            interestReceived: true,
          }),
        )}
        sent={sentOpen.map((i) =>
          cardFor(otherId(i), {
            id: i.id,
            when: formatInboxWhen(i.created_at),
            whenLabel: "Sent",
            href: publicHref(otherId(i)),
          }),
        )}
        accepted={accepted.map((i) =>
          cardFor(otherId(i), {
            id: i.id,
            when: formatInboxWhen(i.created_at),
            whenLabel: "Accepted",
            href: publicHref(otherId(i)),
            accepted: true,
          }),
        )}
        history={history.map((row) => {
          const live = liveHistory.find((item) => item.id === row.id);
          return live
            ? cardFor(otherId(live), {
                id: row.id,
                when: row.when,
                status: row.status,
                reason: live.decline_reason,
              })
            : row;
        })}
        viewed={(views ?? [])
          .filter((v) => viewerMap.has(v.viewer_profile_id))
          .map((v) =>
            cardFor(v.viewer_profile_id, {
              id: `${v.viewer_profile_id}-${v.viewed_at}`,
              when: formatInboxWhen(v.viewed_at),
              whenLabel: "Viewed you",
              href: publicHref(v.viewer_profile_id),
            }),
          )}
        visited={(visits ?? [])
          .filter((v) => viewerMap.has(v.viewed_profile_id) && !idSet.has(v.viewed_profile_id))
          .map((v) =>
            cardFor(v.viewed_profile_id, {
              id: `visit-${v.viewed_profile_id}-${v.viewed_at}`,
              when: formatInboxWhen(v.viewed_at),
              whenLabel: "You viewed",
              href: publicHref(v.viewed_profile_id),
            }),
          )}
      />
      </div>
    </PageShell>
  );
}
