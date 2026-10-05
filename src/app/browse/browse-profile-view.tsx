import { ProfileRedesign, type ProfileData } from "@/app/browse/profile-redesign";
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
import { ageFromDob } from "@/lib/profile/completeness";
import { asStringList, hopeDisplay, hopeValues } from "@/lib/profile/multi-values";
import { maritalLabel } from "@/lib/profile/options";

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
  const { safety } = await searchParams;
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
  const mediaRows = media.data ?? [];
  const photos = mediaRows.filter((m) => m.kind === "photo");

  // Basic profile info
  const dobText = typeof profile.date_of_birth === "string" ? profile.date_of_birth : "";
  const age = dobText ? (ageFromDob(dobText)?.years ?? null) : null;
  const place = [profile.current_city, profile.current_state].filter((v) => typeof v === "string" && v).join(", ");
  const about = typeof profile.about === "string" ? profile.about : null;
  const lastSeen = lastOnlineLine(typeof profile.last_seen_at === "string" ? profile.last_seen_at : null, asProfileType(profile.profile_type) ?? undefined);
  const memberCode = typeof profile.member_code === "string" ? profile.member_code : undefined;

  // Check if shortlisted
  const db = createServiceClient() ?? supabase;
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

  // Separate media by kind
  const videos = mediaRows.filter((m) => m.kind === "video");
  const voices = mediaRows.filter((m) => m.kind === "audio");

  // Build COMPACT profile data - consolidated sections
  const text = (key: string) => String(profile[key as keyof typeof profile] ?? "—");
  
  // COMPACT: Combine personal + faith + work + family into one section
  const details = [
    {
      title: "Physical & Lifestyle",
      items: [
        { k: "Height", v: text("height_cm") ? `${text("height_cm")} cm` : "—" },
        { k: "Diet", v: text("diet") },
        { k: "Health", v: text("health_notes") },
      ],
    },
    {
      title: "Faith & Background",
      items: [
        { k: "Religion", v: nestedName(profile.religions) || "—" },
        { k: "Community", v: nestedName(profile.communities) || "—" },
        { k: "Mother tongue", v: text("mother_tongue") },
        { k: "Family type", v: text("family_type") },
      ],
    },
    {
      title: "Work & Education",
      items: [
        { k: "Education", v: text("qualification") },
        { k: "Occupation", v: text("occupation") },
        { k: "Employer", v: text("employer_name") },
        { k: "Annual income", v: text("income_band") },
      ],
    },
    {
      title: "Location",
      items: [
        { k: "Current city", v: text("current_city") },
        { k: "State", v: text("current_state") },
        { k: "Country", v: text("current_country") },
        { k: "Willing to relocate", v: text("willing_to_relocate") },
      ],
    },
    {
      title: "Astrology",
      items: [
        { k: "Rashi", v: text("rashi") },
        { k: "Nakshatra", v: text("nakshatra") },
        { k: "Mangalik", v: text("manglik") },
      ],
    },
  ];

  const hope = [
    {
      title: "Looking For",
      items: [
        { k: "Age", v: profile.pref_age_min && profile.pref_age_max ? `${profile.pref_age_min}–${profile.pref_age_max}` : "—" },
        { k: "Height", v: profile.pref_height_min && profile.pref_height_max ? `${profile.pref_height_min}–${profile.pref_height_max} cm` : "—" },
        { k: "Marital status", v: hopeDisplay(hopeValues(profile, "pref_maritals"), "Any") },
        { k: "Religion", v: hopeDisplay(hopeValues(profile, "pref_religions"), "Any") },
        { k: "Education", v: hopeDisplay(hopeValues(profile, "pref_educations"), "Any") },
        { k: "Occupation", v: hopeDisplay(hopeValues(profile, "pref_occupations"), "Any") },
        { k: "Location", v: hopeDisplay(hopeValues(profile, "pref_countries"), "Any") },
      ],
    },
  ];

  // Build COMPACT profile data
  const props: ProfileData = {
    id: String(profile.id),
    name: displayFirstName(typeof profile.subject_full_name === "string" ? profile.subject_full_name : "Member"),
    surname: typeof profile.surname === "string" ? profile.surname : undefined,
    age,
    place,
    lastSeen,
    photos,
    photoUrl: publicMediaUrl(photos[0]?.storage_path),
    videos,
    voices,
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
    details,
    hope,
  };

  return (
    <div className="browse-profile-view">
      <ProfileRedesign {...props} />
    </div>
  );
}
