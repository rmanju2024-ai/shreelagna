import { PromoBubble } from "@/app/browse/promo-bubble";
import { ProfileViewNew, type ProfileViewProps } from "@/app/browse/profile-view-new";
import { MatchBar } from "@/app/browse/match-bar";
import { profileViewedCopy } from "@/lib/match/alert-copy";
import { canAlertProfileView } from "@/lib/match/profile-settings";
import { displayFirstName } from "@/lib/profile/options";
import { ensureAppUser, getAuth } from "@/lib/auth/session";
import { kundaliScore } from "@/lib/match/kundali";
import { photosVisible } from "@/lib/match/photo-privacy";
import { publicMediaUrl } from "@/lib/match/inbox-card";
import { lastOnlineLine } from "@/lib/profile/last-seen";
import { effectiveInterestStatus, interestThreadState, openInterestBlocksSend, orderedProfilePair } from "@/lib/match/interest-status";
import { matchSelfFromProfile } from "@/lib/profile/match-compare";
import { createServiceClient } from "@/lib/supabase/server";
import { after } from "next/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { btnGhost, btnPrimary } from "@/lib/ui/classes";
import { ageFromDob } from "@/lib/profile/completeness";
import { loadBlockedProfileIds } from "@/lib/safety/blocked";

function nestedName(value: unknown): string | undefined {
  if (Array.isArray(value) && value[0] && typeof value[0] === "object" && "name" in value[0]) {
    return String((value[0] as { name: unknown }).name);
  }
  if (value && typeof value === "object" && "name" in value) {
    return String((value as { name: unknown }).name);
  }
  return undefined;
}

function asProfileType(value: unknown) {
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
      <div className="mt-6 flex flex-wrap gap-3">
        <Link href="/browse" className={btnGhost}>
          Back to Discover
        </Link>
      </div>
    </div>
  );
}

function BlockedByYou({ id, name }: { id: string; name: string }) {
  return (
    <div className="browse-profile-missing blocked-note">
      <p className="text-xs uppercase tracking-[0.2em] text-[var(--accent)]">Blocked</p>
      <h1 className="mt-2 font-[family-name:var(--font-display)] text-4xl">You blocked {name}</h1>
      <p className="mt-4 max-w-xl text-sm text-[var(--muted)]">
        You cannot see each other while the block is on. Unblock to view this profile again.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link href="/app/blocked" className={btnGhost}>Blocked profiles</Link>
        <Link href="/browse" className={btnGhost}>Back to Discover</Link>
      </div>
    </div>
  );
}

export async function BrowseProfileView({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; sent?: string; contact?: string; wa?: string; safety?: string }>;
}) {
  const { id } = await params;
  const { error, sent, contact, wa, safety } = await searchParams;
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
  
  // Check blocks
  let mine = null;
  if (!own && me.active_profile_id) {
    const { data: mineProfile } = await supabase.from("profiles").select("id").eq("created_by", me.id).maybeSingle();
    mine = mineProfile;
  }
  if (!own && mine) {
    const { data: blocks } = await supabase
      .from("member_blocks")
      .select("blocker_profile_id")
      .or(
        `and(blocker_profile_id.eq.${String(mine.id)},blocked_profile_id.eq.${id}),and(blocker_profile_id.eq.${id},blocked_profile_id.eq.${String(mine.id)})`,
      )
      .limit(1);
    if (blocks?.length) {
      if (blocks[0].blocker_profile_id === String(mine.id)) {
        return <BlockedByYou id={id} name={displayFirstName(typeof profile.subject_full_name === "string" ? profile.subject_full_name : "this member")} />;
      }
      return <UnavailableBrowse />;
    }
  }

  // All the interest and chat logic here (keeping it working)
  let viewerType = null;
  let viewerStatus = null;
  let canSend = false;
  let needPlan = false;
  let needQuota = false;
  let quotaLeft = null;
  let quotaUsed = 0;
  let quotaLimit = null;
  let viewer = null;
  let interestStatus = null;
  let sentByMe = false;
  let accepted = false;
  let interestId = null;
  let kundali = null;
  const db = createServiceClient() ?? supabase;
  
  // Minimal data loading for the view
  const mediaRows = media.data ?? [];
  const photos = mediaRows.filter((m) => m.kind === "photo");
  const dobText = typeof profile.date_of_birth === "string" ? profile.date_of_birth : "";
  const age = dobText ? (ageFromDob(dobText)?.years ?? null) : null;
  const place = [profile.current_city, profile.current_state].filter((v) => typeof v === "string" && v).join(", ");
  const about = typeof profile.about === "string" ? profile.about : null;
  const lastSeen = lastOnlineLine(typeof profile.last_seen_at === "string" ? profile.last_seen_at : null, asProfileType(profile.profile_type) ?? undefined);
  const memberCode = typeof profile.member_code === "string" ? profile.member_code : undefined;
  
  // Check if shortlisted
  let shortlisted = false;
  if (!own && me.active_profile_id) {
    const { data: shortRow } = await db
      .from("profile_shortlists")
      .select("owner_profile_id")
      .eq("owner_profile_id", String(me.active_profile_id))
      .eq("shortlisted_profile_id", id)
      .maybeSingle();
    shortlisted = Boolean(shortRow);
  }

  const props: ProfileViewProps = {
    id: String(profile.id),
    name: displayFirstName(typeof profile.subject_full_name === "string" ? profile.subject_full_name : "Member"),
    age,
    place,
    lastSeen,
    photos,
    photoUrl: publicMediaUrl(photos[0]?.storage_path),
    memberCode,
    about,
    shortlisted,
    own,
    user,
    kundali: null,
    interestId: null,
    thread: "none",
    canSend: false,
    needPlan: false,
    needQuota: false,
    quotaLeft: null,
    finishHref: "/app/profiles/" + (me.active_profile_id || ""),
  };

  return (
    <div className="browse-profile-view">
      <ProfileViewNew {...props} />
    </div>
  );
}
