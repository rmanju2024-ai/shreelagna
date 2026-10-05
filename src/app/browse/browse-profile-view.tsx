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

  // Build complete profile data with ALL fields - NO SLICING
  const text = (key: string) => String(profile[key as keyof typeof profile] ?? "—");
  
  const personal = [
    {
      title: "Physical",
      items: [
        { k: "Height", v: text("height_cm") ? `${text("height_cm")} cm` : "—" },
        { k: "Blood group", v: text("blood_group") },
        { k: "Disability", v: text("physical_status") },
      ],
    },
    {
      title: "Lifestyle",
      items: [
        { k: "Diet", v: text("diet") },
        { k: "Health", v: text("health_notes") },
        { k: "Hobbies", v: asStringList(profile.hobby_list).join(", ") || "—" },
      ],
    },
  ];

  const faith = [
    {
      title: "Religion & Community",
      items: [
        { k: "Religion", v: nestedName(profile.religions) || "—" },
        { k: "Community", v: nestedName(profile.communities) || "—" },
        { k: "Sub-community", v: text("sub_community") },
        { k: "Caste", v: text("caste") },
        { k: "Gothra", v: text("gotra") },
      ],
    },
    {
      title: "Language & Culture",
      items: [
        { k: "Mother tongue", v: text("mother_tongue") },
        { k: "Languages known", v: asStringList(profile.known_languages).join(", ") || "—" },
        { k: "Grew up in", v: text("grew_up_in") },
        { k: "Native state", v: text("native_state") },
        { k: "Native city", v: text("native_city") },
      ],
    },
  ];

  const work = [
    {
      title: "Education",
      items: [
        { k: "Highest education", v: text("qualification") },
        { k: "College", v: text("college_name") },
        { k: "Stream", v: text("stream") },
        { k: "City of birth", v: text("birth_city") },
      ],
    },
    {
      title: "Career",
      items: [
        { k: "Occupation", v: text("occupation") },
        { k: "Employer", v: text("employer_name") },
        { k: "Employed in", v: text("employed_in") },
        { k: "Annual income", v: text("income_band") },
        { k: "Settle abroad", v: text("settle_abroad") },
        { k: "Future ambition", v: text("future_ambition") },
      ],
    },
  ];

  const family = [
    {
      title: "Family Background",
      items: [
        { k: "Family type", v: text("family_type") },
        { k: "Family status", v: text("family_status") },
        { k: "Family location", v: text("family_location") },
        { k: "Father", v: text("father_name") },
        { k: "Father's occupation", v: text("father_occupation") },
        { k: "Mother", v: text("mother_name") },
        { k: "Mother's occupation", v: text("mother_occupation") },
        { k: "Brothers", v: text("brothers_count") },
        { k: "Brothers married", v: text("brothers_married_count") },
        { k: "Sisters", v: text("sisters_count") },
        { k: "Sisters married", v: text("sisters_married_count") },
        { k: "Siblings note", v: text("siblings_note") },
      ],
    },
  ];

  const astro = [
    {
      title: "Birth Details",
      items: [
        { k: "Date of birth", v: text("date_of_birth") },
        { k: "Time of birth", v: text("birth_time") },
        { k: "City of birth", v: text("birth_city") },
      ],
    },
    {
      title: "Horoscope",
      items: [
        { k: "Rashi", v: text("rashi") },
        { k: "Nakshatra", v: text("nakshatra") },
        { k: "Nakshatra pada", v: text("nakshatra_pada") },
        { k: "Lagna", v: text("lagna") },
        { k: "Gana", v: text("gana") },
        { k: "Yoni animal", v: text("yoni_animal") },
        { k: "Mangalik", v: text("manglik") },
      ],
    },
  ];

  const residence = [
    {
      title: "Current Location",
      items: [
        { k: "Country", v: text("current_country") },
        { k: "State", v: text("current_state") },
        { k: "City", v: text("current_city") },
        { k: "Pin code", v: text("pin_code") },
        { k: "Living arrangement", v: text("living_arrangement") },
        { k: "Citizenship", v: text("citizenship") },
        { k: "Willing to relocate", v: text("willing_to_relocate") },
      ],
    },
  ];

  const hope = [
    {
      title: "Partner Preferences",
      items: [
        { k: "Age", v: profile.pref_age_min && profile.pref_age_max ? `${profile.pref_age_min}–${profile.pref_age_max} years` : "—" },
        { k: "Height", v: profile.pref_height_min && profile.pref_height_max ? `${profile.pref_height_min}–${profile.pref_height_max} cm` : "—" },
        { k: "Marital status", v: hopeDisplay(hopeValues(profile, "pref_maritals"), "Any") },
        { k: "Religion", v: hopeDisplay(hopeValues(profile, "pref_religions"), "Any") },
        { k: "Languages", v: hopeDisplay(hopeValues(profile, "pref_tongues"), "Any") },
        { k: "Education", v: hopeDisplay(hopeValues(profile, "pref_educations"), "Any") },
        { k: "Occupation", v: hopeDisplay(hopeValues(profile, "pref_occupations"), "Any") },
        { k: "Diet", v: hopeDisplay(hopeValues(profile, "pref_diets"), "Any") },
        { k: "Income", v: hopeDisplay(hopeValues(profile, "pref_incomes"), "Any") },
        { k: "Location", v: hopeDisplay(hopeValues(profile, "pref_countries"), "Any") },
      ],
    },
  ];

  // Build profile data with ALL sections and media
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
    personal,
    faith,
    work,
    family,
    residence,
    astro,
    hope,
  };

  return (
    <div className="browse-profile-view">
      <ProfileRedesign {...props} />
    </div>
  );
}
