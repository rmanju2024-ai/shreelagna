import { viewContact } from "@/app/app/profiles/actions";
import { BirdDock } from "@/app/browse/bird-dock";
import { MatchBar } from "@/app/browse/match-bar";
import { profileViewedCopy } from "@/lib/match/alert-copy";
import { canAlertProfileView, isIncognito } from "@/lib/match/profile-settings";
import { displayFirstName } from "@/lib/profile/options";
import { ProfilePortrait } from "@/app/app/profiles/profile-portrait";
import { ensureAppUser, getAuth } from "@/lib/auth/session";
import { kundaliScore } from "@/lib/match/kundali";
import { photosVisible } from "@/lib/match/photo-privacy";
import { publicMediaUrl } from "@/lib/match/inbox-card";
import { lastOnlineLine } from "@/lib/profile/last-seen";
import { effectiveInterestStatus, interestThreadState, openInterestBlocksSend, orderedProfilePair } from "@/lib/match/interest-status";
import { matchSelfFromProfile } from "@/lib/profile/match-compare";
import { canEditMemberProfile } from "@/lib/desk/access";
import { canViewProfile, isPublicProfileStatus, type ProfileType } from "@/lib/profile/visibility";
import { complimentaryPaidProfileAccess, pairPlanLive } from "@/lib/membership/access";
import { loadInterestQuota, loadMembership } from "@/lib/membership/load";
import { createServiceClient } from "@/lib/supabase/server";
import { btnGhost, btnPrimary } from "@/lib/ui/classes";
import Link from "next/link";
import { redirect } from "next/navigation";

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
        This profile cannot be opened from Alerts. It may be house, paused, or no longer on Search.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link href="/app/alerts" className={btnPrimary}>
          Back to alerts
        </Link>
        <Link href="/browse" className={btnGhost}>
          Search
        </Link>
      </div>
    </div>
  );
}

export async function BrowseProfileView({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; sent?: string; contact?: string; wa?: string }>;
}) {
  const { id } = await params;
  const { error, sent, contact, wa } = await searchParams;
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
  let quotaUsed = 0;
  let quotaLimit: number | null = null;
  let viewer = null;
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
  if (mine && String(mine.id) !== id) {
    const [{ data: myPhotos }, { data: interestRows }] = await Promise.all([
      db
        .from("media")
        .select("storage_path")
        .eq("profile_id", String(mine.id))
        .eq("kind", "photo")
        .order("created_at")
        .limit(1),
      db
        .from("interests")
        .select("id, from_profile_id, to_profile_id, status, created_at")
        .or(`from_profile_id.eq.${id},to_profile_id.eq.${id}`),
    ]);
    viewerType = asProfileType(mine.profile_type);
    viewerStatus = typeof mine.status === "string" ? mine.status : null;
    const quota = await loadInterestQuota(db, me, access, [String(mine.id)]);
    quotaLeft = quota.left;
    quotaUsed = quota.used;
    quotaLimit = quota.limit;
    needQuota = !quota.canSend;
    canSend = Boolean(mine.is_complete && isPublicProfileStatus(mine.status) && !needPlan && quota.canSend);
    viewer = matchSelfFromProfile(mine, {
      religion: nestedName(mine.religions),
      community: nestedName(mine.communities),
      photoPath: myPhotos?.[0]?.storage_path ?? null,
    });
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

  const targetType = asProfileType(profile.profile_type);
  const thread = interestThreadState(interestStatus, sentByMe || Boolean(sent));
  const linkedByInterest = thread === "sent" || thread === "received" || thread === "accepted";
  const { data: owner } = await db
    .from("app_users")
    .select("id, role, email, welcome_started_at, welcome_days")
    .eq("id", profile.created_by)
    .maybeSingle();
  const targetAccess = owner ? await loadMembership(db, owner) : null;
  const pairLive = pairPlanLive(access.live, targetAccess?.live);
  const myChatId = mine && String(mine.id) !== id ? String(mine.id) : null;
  let chatThreadId: string | null = null;
  let chatNotes: { id: string; sender_profile_id: string; body: string; created_at: string; read_at?: string | null }[] = [];
  if (myChatId && linkedByInterest) {
    const [a, b] = orderedProfilePair(myChatId, id);
    const { data: chatThread } = await db
      .from("threads")
      .select("id")
      .eq("profile_a", a)
      .eq("profile_b", b)
      .maybeSingle();
    chatThreadId = typeof chatThread?.id === "string" ? chatThread.id : null;
    if (chatThreadId) {
      const full = await db
        .from("messages")
        .select("id, sender_profile_id, body, created_at, read_at")
        .eq("thread_id", chatThreadId)
        .order("created_at", { ascending: false })
        .limit(80);
      const rows = full.error
        ? (
            await db
              .from("messages")
              .select("id, sender_profile_id, body, created_at")
              .eq("thread_id", chatThreadId)
              .order("created_at", { ascending: false })
              .limit(80)
          ).data
        : full.data;
      chatNotes = [...(rows ?? [])].reverse();
    }
  }
  const guestPass = complimentaryPaidProfileAccess({
    viewerKind: access.kind,
    targetKind: targetAccess?.kind,
    interestOpen: openInterestBlocksSend(interestStatus),
    pairLive,
  });
  const planLocked = !access.live && !own && !isStaff && !guestPass;
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

  if (
    !isStaff &&
    me.active_profile_id &&
    me.active_profile_id !== id &&
    !own &&
    mine &&
    !isIncognito(mine)
  ) {
    await supabase.from("profile_views").upsert(
      {
        viewer_profile_id: me.active_profile_id,
        viewed_profile_id: id,
        viewed_at: new Date().toISOString(),
      },
      { onConflict: "viewer_profile_id,viewed_profile_id" },
    );
    const ownerId = typeof profile.created_by === "string" ? profile.created_by : null;
    if (ownerId && canAlertProfileView(profile)) {
      const viewerName = displayFirstName(
        typeof mine.subject_full_name === "string" ? mine.subject_full_name : "Someone",
      );
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
          .update({
            created_at: now,
            read_at: null,
            title: copy.title,
            body: copy.body,
            href: `/browse/${mine.id}`,
          })
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
  const video = mediaRows.find((m) => m.kind === "video") ?? null;
  const audio = mediaRows.find((m) => m.kind === "audio") ?? null;
  const memberCode = typeof profile.member_code === "string" ? profile.member_code : undefined;
  const religionName = nestedName(profile.religions);
  const communityName = nestedName(profile.communities);
  const hideLastSeen = Boolean(profile.hide_last_seen) && !own && !isStaff;
  const { data: contactRow } =
    !own && mine
      ? await db
          .from("contact_views")
          .select("id")
          .eq("viewer_profile_id", String(mine.id))
          .eq("viewed_profile_id", id)
          .maybeSingle()
      : { data: null };
  const contactRevealed = Boolean(own || isStaff || contactRow?.id || contact || guestPass);
  const mobile =
    typeof profile.subject_mobile === "string" && profile.subject_mobile.trim() ? profile.subject_mobile.trim() : "—";
  const email = typeof owner?.email === "string" && owner.email.trim() ? owner.email.trim() : "—";

  return (
    <div className="browse-profile-view">
      <ProfilePortrait
        profile={hideLastSeen ? { ...profile, last_seen_at: null } : profile}
        memberCode={memberCode}
        religionName={religionName}
        communityName={communityName}
        photos={photos}
        photoLocked={photos.length === 0}
        lockAlbumExtras={!showAlbum}
        video={video}
        audio={audio}
        readOnly
        deskReview={isStaff}
        houseEdit={Boolean(isStaff && owner && canEditMemberProfile(me, { id: profile.created_by, role: owner.role }))}
        viewer={viewer}
        contact={{ revealed: contactRevealed, mobile, email }}
        needPlan={planLocked}
        interest={
          !own && user ? (
            <div className="match-dock">
              <MatchBar
                profileId={String(profile.id)}
                interestId={interestId}
                finishHref={`/app/profiles/${mine?.id ?? ""}`}
                thread={thread}
                canSend={canSend}
                needPlan={needPlan}
                needQuota={needQuota}
                quotaLeft={quotaLeft}
                kundali={kundali}
                chat={{
                  myProfileId: myChatId,
                  threadId: chatThreadId,
                  notes: chatNotes,
                  live: pairLive,
                }}
              />
              <div className="match-dock-face">
                {error === "incomplete" ? (
                  <p className="match-dock-note is-warn">
                    Finish your profile to send interest. You can still receive notes from others.
                  </p>
                ) : null}
                {error === "plan" ? (
                  <p className="match-dock-note is-warn">
                    Plan needed to send interest or view contact. <Link href="/app/plans">Open plans</Link>
                  </p>
                ) : null}
                {error === "quota" || needQuota ? (
                  <p className="match-dock-note is-warn">
                    Limit reached. <Link href="/app/plans">See plans</Link>
                  </p>
                ) : null}
                {error === "could_not_send" ? (
                  <p className="match-dock-note is-warn">Interest could not be sent just now. Please try again.</p>
                ) : null}
                {sent && (wa === "0" || wa === "allowlist" || wa === "denied" || wa === "net" || wa === "config" || wa === "mobile") ? (
                  <p className="match-dock-note is-warn">
                    {wa === "allowlist" || wa === "denied"
                      ? "Interest is saved. Meta blocked WhatsApp: add this profile’s mobile under WhatsApp → API Setup → To, accept the invite on that phone, then cancel and send again."
                      : wa === "net"
                        ? "Interest is saved. This computer could not reach Meta’s WhatsApp API."
                        : wa === "mobile"
                          ? "Interest is saved. That profile has no mobile number to message."
                          : wa === "config"
                            ? "Interest is saved. WhatsApp is not configured on the server."
                            : "Interest is saved. WhatsApp did not reach the other person — it goes to their profile mobile, which must be in the Meta test recipient list."}
                  </p>
                ) : null}
                {(canSend || guestPass) && !isStaff && !contactRevealed ? (
                  <>
                    <p className="match-dock-note is-warn">Each view counts, including this profile again.</p>
                    <div className="portrait-contact-actions">
                      <form action={viewContact}>
                        <input type="hidden" name="to_profile_id" value={profile.id} />
                        <button type="submit" className={btnGhost}>
                          View mobile
                        </button>
                      </form>
                      <form action={viewContact}>
                        <input type="hidden" name="to_profile_id" value={profile.id} />
                        <button type="submit" className={btnGhost}>
                          View email
                        </button>
                      </form>
                    </div>
                  </>
                ) : null}
              </div>
            </div>
          ) : null
        }
      />
      {!own && user ? (
        <BirdDock
          profileId={String(profile.id)}
          interestId={interestId}
          thread={thread}
          canSend={canSend}
          needPlan={needPlan}
          needQuota={needQuota}
          quotaLeft={quotaLeft}
          finishHref={`/app/profiles/${mine?.id ?? ""}`}
          chat={{
            myProfileId: myChatId,
            threadId: chatThreadId,
            notes: chatNotes,
            live: pairLive,
            name: displayFirstName(typeof profile.subject_full_name === "string" ? profile.subject_full_name : "Match"),
            photo: publicMediaUrl(photos[0]?.storage_path),
            seen: hideLastSeen ? null : lastOnlineLine(typeof profile.last_seen_at === "string" ? profile.last_seen_at : null, asProfileType(profile.profile_type) ?? undefined),
          }}
        />
      ) : null}
    </div>
  );
}
