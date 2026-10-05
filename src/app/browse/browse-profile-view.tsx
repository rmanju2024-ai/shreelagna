import { ProfileRedesign, type ProfileData } from "@/app/browse/profile-redesign";
import { profileViewedCopy } from "@/lib/match/alert-copy";
import { canAlertProfileView } from "@/lib/match/profile-settings";
import { displayFirstName } from "@/lib/profile/options";
import { ensureAppUser, getAuth } from "@/lib/auth/session";
import { kundaliScore } from "@/lib/match/kundali";
import { photosVisible } from "@/lib/match/photo-privacy";
import { publicMediaUrl } from "@/lib/match/inbox-card";
import { lastOnlineLine } from "@/lib/profile/last-seen";
import {
  effectiveInterestStatus,
  interestThreadState,
  openInterestBlocksSend,
  orderedProfilePair,
} from "@/lib/match/interest-status";
import { complimentaryPaidProfileAccess, pairPlanLive } from "@/lib/membership/access";
import { loadInterestQuota, loadMembership } from "@/lib/membership/load";
import { canViewProfile, isPublicProfileStatus, type ProfileType } from "@/lib/profile/visibility";
import { createServiceClient } from "@/lib/supabase/server";
import { after } from "next/server";
import { redirect } from "next/navigation";
import { ageFromDob } from "@/lib/profile/completeness";
import { asStringList, hopeDisplay, hopeValues } from "@/lib/profile/multi-values";

function nestedName(value: unknown): string | undefined {
  if (Array.isArray(value) && value[0] && typeof value[0] === "object" && "name" in value[0]) {
    return String((value[0] as { name: unknown }).name);
  }
  if (value && typeof value === "object" && "name" in value) {
    return String((value as { name: unknown }).name);
  }
  return undefined;
}

function asProfileType(value: unknown): ProfileType | null {
  return value === "vadhu" || value === "vara" ? value : null;
}

function UnavailableBrowse() {
  return (
    <div className="browse-profile-missing">
      <p className="text-xs uppercase tracking-[0.2em] text-[var(--accent)]">Search</p>
      <h1 className="mt-2 font-[family-name:var(--font-display)] text-4xl">Profile not available</h1>
      <p className="mt-4 max-w-xl text-sm text-[var(--muted)]">
        This profile cannot be opened. It may be paused, removed, or no longer on Search.
      </p>
    </div>
  );
}

function dash(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  const text = String(value);
  return text === "—" || text === "null" || text === "undefined" ? "—" : text;
}

export async function BrowseProfileView({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; sent?: string; contact?: string; wa?: string; safety?: string }>;
}) {
  const { id } = await params;
  const { sent } = await searchParams;
  const { supabase, user } = await getAuth();
  if (!supabase || !user) redirect(`/login?next=/browse/${id}`);
  const me = await ensureAppUser(supabase, user);
  if (!me) redirect("/login?error=account");

  const [profileJoin, media] = await Promise.all([
    supabase.from("profiles").select("*, religions(name), communities(name)").eq("id", id).maybeSingle(),
    supabase.from("media").select("id, kind, storage_path, status, is_primary").eq("profile_id", id).order("created_at"),
  ]);
  let profile = profileJoin.data;
  if (!profile) {
    const plain = await supabase.from("profiles").select("*").eq("id", id).maybeSingle();
    profile = plain.data;
  }
  if (!profile) return <UnavailableBrowse />;

  const own = me.id === profile.created_by;
  const isStaff = me.role === "service" || me.role === "admin";
  let viewerType: ProfileType | null = null;
  let viewerStatus: string | null = null;
  let canSend = false;
  let needPlan = false;
  let needQuota = false;
  let quotaLeft: number | null = null;
  let awaitingReview = false;
  let interestStatus: ReturnType<typeof effectiveInterestStatus> | null = null;
  let sentByMe = false;
  let accepted = false;
  let interestId: string | null = null;
  let kundali: ReturnType<typeof kundaliScore> | null = null;
  const db = createServiceClient() ?? supabase;
  const access = await loadMembership(db, me);
  needPlan = !access.live;
  const { data: myProfiles } = own
    ? { data: [] as Record<string, unknown>[] }
    : await db.from("profiles").select("*, religions(name), communities(name)").eq("created_by", me.id);
  const mineList = myProfiles ?? [];
  const mine =
    mineList.find((row) => row.id === me.active_profile_id) ??
    mineList.find((row) => isPublicProfileStatus(typeof row.status === "string" ? row.status : null)) ??
    mineList[0] ??
    null;
  const myIds = mineList.map((row) => String(row.id)).filter((profileId) => profileId !== id);
  let chatThreadId: string | null = null;
  let chatNotes: { id: string; sender_profile_id: string; body: string; created_at: string; read_at?: string | null }[] = [];

  if (mine && String(mine.id) !== id) {
    const { data: interestRows } = await db
      .from("interests")
      .select("id, from_profile_id, to_profile_id, status, created_at")
      .or(`from_profile_id.eq.${id},to_profile_id.eq.${id}`);
    viewerType = asProfileType(mine.profile_type);
    viewerStatus = typeof mine.status === "string" ? mine.status : null;
    const quota = await loadInterestQuota(db, me, access, [String(mine.id)]);
    quotaLeft = quota.left;
    needQuota = !quota.canSend;
    const complete = Boolean(mine.is_complete);
    const live = isPublicProfileStatus(typeof mine.status === "string" ? mine.status : null);
    awaitingReview = complete && !live;
    canSend = Boolean(complete && live && !needPlan && quota.canSend);
    const link = (interestRows ?? []).find(
      (row) => myIds.includes(row.from_profile_id) || myIds.includes(row.to_profile_id),
    );
    interestStatus = link ? effectiveInterestStatus(link.status, link.created_at) : null;
    sentByMe = Boolean(link && myIds.includes(link.from_profile_id));
    accepted = interestStatus === "accepted";
    interestId = typeof link?.id === "string" ? link.id : null;
    kundali = kundaliScore(
      {
        rashi: typeof mine.rashi === "string" ? mine.rashi : null,
        nakshatra: typeof mine.nakshatra === "string" ? mine.nakshatra : null,
        gana: typeof mine.gana === "string" ? mine.gana : null,
        yoni: typeof mine.yoni_animal === "string" ? mine.yoni_animal : null,
        manglik: typeof mine.manglik === "string" ? mine.manglik : null,
      },
      {
        rashi: typeof profile.rashi === "string" ? profile.rashi : null,
        nakshatra: typeof profile.nakshatra === "string" ? profile.nakshatra : null,
        gana: typeof profile.gana === "string" ? profile.gana : null,
        yoni: typeof profile.yoni_animal === "string" ? profile.yoni_animal : null,
        manglik: typeof profile.manglik === "string" ? profile.manglik : null,
      },
    );
  } else if (own) {
    viewerType = asProfileType(profile.profile_type);
  }

  if (!own && mine) {
    const { data: blocks } = await db
      .from("member_blocks")
      .select("blocker_profile_id")
      .or(
        `and(blocker_profile_id.eq.${String(mine.id)},blocked_profile_id.eq.${id}),and(blocker_profile_id.eq.${id},blocked_profile_id.eq.${String(mine.id)})`,
      )
      .limit(1);
    if (blocks?.length) return <UnavailableBrowse />;
  }

  const targetType = asProfileType(profile.profile_type);
  const thread = interestThreadState(interestStatus, sentByMe || Boolean(sent));
  const linkedByInterest = thread === "sent" || thread === "received" || thread === "accepted";
  const { data: owner } = await db
    .from("app_users")
    .select("id, role, welcome_started_at, welcome_days")
    .eq("id", profile.created_by)
    .maybeSingle();
  const targetAccess = owner ? await loadMembership(db, owner) : null;
  const pairLive = pairPlanLive(access.live, targetAccess?.live);
  const myChatId = mine && String(mine.id) !== id ? String(mine.id) : null;
  if (myChatId && linkedByInterest) {
    const [a, b] = orderedProfilePair(myChatId, id);
    const { data: chatThread } = await db.from("threads").select("id").eq("profile_a", a).eq("profile_b", b).maybeSingle();
    chatThreadId = typeof chatThread?.id === "string" ? chatThread.id : null;
    if (chatThreadId) {
      const full = await db
        .from("messages")
        .select("id, sender_profile_id, body, created_at, read_at")
        .eq("thread_id", chatThreadId)
        .order("created_at", { ascending: false })
        .limit(80);
      chatNotes = [...(full.data ?? [])].reverse();
    }
  }

  const guestPass = complimentaryPaidProfileAccess({
    viewerKind: access.kind,
    targetKind: targetAccess?.kind,
    interestOpen: openInterestBlocksSend(interestStatus),
    pairLive,
  });
  const allowed = Boolean(
    targetType &&
      canViewProfile({
        viewerType,
        viewerStatus,
        targetType,
        targetStatus: typeof profile.status === "string" ? profile.status : "hidden",
        isOwner: own,
        isStaff,
        linkedByInterest,
        targetOwnerIsAdmin: owner?.role === "admin",
        viewerIsAdmin: me.role === "admin",
      }),
  );
  if (!allowed) return <UnavailableBrowse />;

  if (!isStaff && me.active_profile_id && me.active_profile_id !== id && !own && mine) {
    const viewerId = me.active_profile_id;
    after(async () => {
      await supabase.from("profile_views").upsert(
        {
          viewer_profile_id: viewerId,
          viewed_profile_id: id,
          viewed_at: new Date().toISOString(),
        },
        { onConflict: "viewer_profile_id,viewed_profile_id" },
      );
      const ownerId = typeof profile.created_by === "string" ? profile.created_by : null;
      if (ownerId && canAlertProfileView(profile)) {
        const viewerName = displayFirstName(typeof mine.subject_full_name === "string" ? mine.subject_full_name : "Someone");
        const copy = profileViewedCopy(viewerName);
        const now = new Date().toISOString();
        const { data: existing } = await db
          .from("notices")
          .select("id")
          .eq("user_id", ownerId)
          .eq("kind", "profile_view")
          .eq("match_profile_id", String(mine.id))
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (existing) {
          await db
            .from("notices")
            .update({ created_at: now, read_at: null, title: copy.title, body: copy.body, href: `/browse/${mine.id}` })
            .eq("id", existing.id);
        } else {
          await db.from("notices").insert({
            user_id: ownerId,
            kind: copy.kind,
            title: copy.title,
            body: copy.body,
            href: `/browse/${mine.id}`,
            match_profile_id: String(mine.id),
          });
        }
      }
    });
  }

  const mediaRows = media.data ?? [];
  const showAlbum = photosVisible({
    own,
    staff: isStaff,
    hideUntilAccept: profile.hide_photo_until_accept as boolean | null | undefined,
    accepted: accepted && pairLive,
    interestReceived: Boolean(pairLive && ((interestStatus === "pending" && !sentByMe) || guestPass)),
  });
  const sortedPhotos = mediaRows
    .filter((m) => m.kind === "photo")
    .sort((a, b) => Number(Boolean((b as { is_primary?: boolean }).is_primary)) - Number(Boolean((a as { is_primary?: boolean }).is_primary)));
  const photos = showAlbum ? sortedPhotos : sortedPhotos.slice(0, 1);
  const videos = mediaRows.filter((m) => m.kind === "video");
  const voices = mediaRows.filter((m) => m.kind === "audio");

  const dobText = typeof profile.date_of_birth === "string" ? profile.date_of_birth : "";
  const age = dobText ? (ageFromDob(dobText)?.years ?? null) : null;
  const place = [profile.current_city, profile.current_state].filter((v) => typeof v === "string" && v).join(", ");
  const about = typeof profile.about === "string" ? profile.about : null;
  const lastSeen = lastOnlineLine(
    typeof profile.last_seen_at === "string" ? profile.last_seen_at : null,
    asProfileType(profile.profile_type) ?? undefined,
  );
  const memberCode = typeof profile.member_code === "string" ? profile.member_code : undefined;

  let shortlisted = false;
  if (!own && mine) {
    const { data: shortRow } = await db
      .from("profile_shortlists")
      .select("owner_profile_id")
      .eq("owner_profile_id", String(mine.id))
      .eq("shortlisted_profile_id", id)
      .maybeSingle();
    shortlisted = Boolean(shortRow);
  }

  const details = [
    {
      icon: "✦",
      title: "Lifestyle",
      items: [
        { k: "Height", v: profile.height_cm ? `${profile.height_cm} cm` : "—" },
        { k: "Diet", v: dash(profile.diet) },
        { k: "Health", v: dash(profile.health_notes) },
        { k: "Blood group", v: dash(profile.blood_group) },
        { k: "Hobbies", v: asStringList(profile.hobby_list).join(", ") || "—" },
      ],
    },
    {
      icon: "🕉",
      title: "Faith",
      items: [
        { k: "Religion", v: nestedName(profile.religions) || "—" },
        { k: "Community", v: nestedName(profile.communities) || "—" },
        { k: "Sub-community", v: dash(profile.sub_community) },
        { k: "Gothra", v: dash(profile.gotra) },
        { k: "Mother tongue", v: dash(profile.mother_tongue) },
        { k: "Languages", v: asStringList(profile.known_languages).join(", ") || "—" },
      ],
    },
    {
      icon: "◎",
      title: "Work",
      items: [
        { k: "Education", v: dash(profile.qualification) },
        { k: "College", v: dash(profile.college_name) },
        { k: "Occupation", v: dash(profile.occupation) },
        { k: "Employer", v: dash(profile.employer_name) },
        { k: "Employed in", v: dash(profile.employed_in) },
        { k: "Income", v: dash(profile.income_band) },
      ],
    },
    {
      icon: "⌂",
      title: "Family",
      items: [
        { k: "Family type", v: dash(profile.family_type) },
        { k: "Family status", v: dash(profile.family_status) },
        { k: "Father", v: dash(profile.father_name) },
        { k: "Mother", v: dash(profile.mother_name) },
        { k: "Brothers", v: dash(profile.brothers_count) },
        { k: "Sisters", v: dash(profile.sisters_count) },
      ],
    },
    {
      icon: "⌖",
      title: "Place",
      items: [
        { k: "City", v: dash(profile.current_city) },
        { k: "State", v: dash(profile.current_state) },
        { k: "Country", v: dash(profile.current_country) },
        { k: "Native", v: dash(profile.native_state) },
        { k: "Grew up in", v: dash(profile.grew_up_in) },
        { k: "Willing to relocate", v: dash(profile.willing_to_relocate) },
      ],
    },
    {
      icon: "☽",
      title: "Kundali",
      items: [
        { k: "Rashi", v: dash(profile.rashi) },
        { k: "Nakshatra", v: dash(profile.nakshatra) },
        { k: "Lagna", v: dash(profile.lagna) },
        { k: "Mangalik", v: dash(profile.manglik) },
        { k: "Gana", v: dash(profile.gana) },
        { k: "Birth time", v: dash(profile.birth_time) },
      ],
    },
  ];

  const hope = [
    { k: "Age", v: profile.pref_age_min && profile.pref_age_max ? `${profile.pref_age_min}–${profile.pref_age_max}` : "—" },
    { k: "Height", v: profile.pref_height_min && profile.pref_height_max ? `${profile.pref_height_min}–${profile.pref_height_max} cm` : "—" },
    { k: "Marital status", v: hopeDisplay(hopeValues(profile, "pref_maritals"), "Any") },
    { k: "Religion", v: hopeDisplay(hopeValues(profile, "pref_religions"), "Any") },
    { k: "Education", v: hopeDisplay(hopeValues(profile, "pref_educations"), "Any") },
    { k: "Occupation", v: hopeDisplay(hopeValues(profile, "pref_occupations"), "Any") },
    { k: "Location", v: hopeDisplay(hopeValues(profile, "pref_countries"), "Any") },
  ];

  const photoUrls = photos.map((p) => publicMediaUrl(p.storage_path)).filter((url): url is string => Boolean(url));
  const videoUrls = videos.map((v) => publicMediaUrl(v.storage_path)).filter((url): url is string => Boolean(url));
  const voiceUrls = voices.map((v) => publicMediaUrl(v.storage_path)).filter((url): url is string => Boolean(url));

  const props: ProfileData = {
    id: String(profile.id),
    name: displayFirstName(typeof profile.subject_full_name === "string" ? profile.subject_full_name : "Member"),
    surname: typeof profile.surname === "string" ? profile.surname : undefined,
    age,
    place,
    lastSeen: Boolean(profile.hide_last_seen) && !own && !isStaff ? null : lastSeen,
    photos,
    photoUrl: photoUrls[0] ?? null,
    photoUrls,
    videoUrls,
    voiceUrls,
    memberCode,
    about,
    shortlisted,
    own,
    user,
    kundali,
    interestId,
    thread,
    canSend,
    needPlan,
    needQuota,
    awaitingReview,
    quotaLeft,
    finishHref: "/app/profiles/" + (mine?.id || me.active_profile_id || ""),
    details,
    hope,
    chat: {
      myProfileId: myChatId,
      threadId: chatThreadId,
      notes: chatNotes,
      live: pairLive,
      name: displayFirstName(typeof profile.subject_full_name === "string" ? profile.subject_full_name : "Match"),
      photo: photoUrls[0] ?? null,
      seen: lastSeen,
    },
  };

  return (
    <div className="browse-profile-view">
      <ProfileRedesign {...props} />
    </div>
  );
}
