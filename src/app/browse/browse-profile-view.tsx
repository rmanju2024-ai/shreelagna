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
import { ageFromDob, formatBirthTime } from "@/lib/profile/completeness";
import { asStringList, hopeDisplay, hopeValues } from "@/lib/profile/multi-values";
import { aboutPlainText } from "@/lib/profile/about-html";
import { maritalLabel, NATIVE_COUNTRIES } from "@/lib/profile/options";

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

function hasValue(value: unknown): boolean {
  const text = dash(value);
  return text !== "—";
}

function asCount(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function sayCount(n: number): string {
  const words = ["no", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];
  return n >= 0 && n < words.length ? words[n] : String(n);
}

function line(text: string | null | undefined): string | null {
  if (!text?.trim()) return null;
  return `${text.trim().replace(/[.]+$/, "")}.`;
}

function linesOf(...parts: Array<string | null | undefined>): string[] {
  return parts.map(line).filter((part): part is string => Boolean(part));
}

function asRole(value: unknown): string {
  const text = dash(value);
  if (!hasValue(text)) return text;
  if (text === text.toUpperCase()) return text;
  return text.charAt(0).toLowerCase() + text.slice(1);
}

function parentSentence(name: unknown, work: unknown, who: "Father" | "Mother"): string | null {
  if (hasValue(name) && hasValue(work)) return `${who} is ${dash(name)}, working as ${dash(work)}`;
  if (hasValue(name)) return `${who} is ${dash(name)}`;
  if (hasValue(work)) return `${who}'s work is ${dash(work)}`;
  return null;
}

function siblingSummary(kind: "brother" | "sister", totalRaw: unknown, marriedRaw: unknown): string | null {
  const total = asCount(totalRaw);
  if (total === null) return null;
  const married = asCount(marriedRaw);
  const plural = kind === "brother" ? "brothers" : "sisters";
  const one = kind === "brother" ? "brother" : "sister";
  if (total === 0) return kind === "brother" ? "No brothers" : "No sisters";
  const noun = total === 1 ? one : plural;
  const head = `${sayCount(total)[0].toUpperCase()}${sayCount(total).slice(1)} ${noun}`;
  if (married === null) return head;
  if (married <= 0) return `${head}, none married`;
  if (married >= total) return total === 1 ? `${head}, married` : total === 2 ? `${head}, both married` : `${head}, all married`;
  if (married === 1) return `${head}, one married`;
  return `${head}, ${sayCount(married)} married`;
}

function formatDob(value: unknown): string | null {
  if (!hasValue(value)) return null;
  const raw = dash(value);
  const at = new Date(`${raw}T00:00:00`);
  if (Number.isNaN(at.getTime())) return raw;
  return at.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
}

function fact(k: string, v: unknown): { k: string; v: string } | null {
  return hasValue(v) ? { k, v: dash(v) } : null;
}

function factsOf(...rows: Array<{ k: string; v: string } | null | undefined>) {
  return rows.filter((row): row is { k: string; v: string } => Boolean(row));
}

function placeLine(city: unknown, state: unknown, country: unknown): string | null {
  const bits = [city, state, country].filter(hasValue).map(dash);
  return bits.length ? bits.join(", ") : null;
}

function countryKey(value: unknown): string | null {
  if (!hasValue(value)) return null;
  return dash(value).trim().toLowerCase().replace(/\.+$/, "").replace(/\s+/g, " ");
}

const COUNTRY_KEYS = new Set(NATIVE_COUNTRIES.map((name) => countryKey(name)).filter((name): name is string => Boolean(name)));

function listedCountry(value: unknown): string | null {
  const key = countryKey(value);
  return key && COUNTRY_KEYS.has(key) ? key : null;
}

function grewCountryKey(grewUp: unknown, nativeCountry: unknown): string | null {
  const native = listedCountry(nativeCountry) ?? countryKey(nativeCountry);
  if (!hasValue(grewUp)) return native;
  const bits = dash(grewUp)
    .split(/[,/|]/)
    .map((bit) => listedCountry(bit))
    .filter((bit): bit is string => Boolean(bit));
  return bits[0] ?? native;
}

function grewUpSentence(who: string, grewUp: unknown, nativeCountry: unknown, currentCountry: unknown): string | null {
  const now = listedCountry(currentCountry) ?? countryKey(currentCountry);
  const then = grewCountryKey(grewUp, nativeCountry);
  if (now && then && now === then) return null;
  const shown = hasValue(grewUp) ? dash(grewUp) : hasValue(nativeCountry) ? dash(nativeCountry) : null;
  if (!shown || (now && (listedCountry(shown) ?? countryKey(shown)) === now)) return null;
  return `${who} grew up in ${shown}`;
}

function profileHeadline(fullName: unknown, surname: unknown): { name: string; surname?: string } {
  const raw = typeof fullName === "string" ? fullName.trim() : "";
  const name = displayFirstName(raw || "Member");
  const sur = typeof surname === "string" ? surname.trim() : "";
  if (!sur || sur.toLowerCase() === name.toLowerCase()) return { name };
  return { name, surname: sur };
}

function birthTimeLabel(value: unknown): string | null {
  if (!hasValue(value)) return null;
  return formatBirthTime(dash(value)) ?? dash(value);
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
  const about = aboutPlainText(typeof profile.about === "string" ? profile.about : null) || null;
  const familyAbout = aboutPlainText(typeof profile.siblings_note === "string" ? profile.siblings_note : null) || null;
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

  const yesNo = (value: unknown) => {
    if (value === true || value === "true") return "Yes";
    if (value === false || value === "false") return "No";
    return dash(value);
  };

  const marital = maritalLabel(typeof profile.marital_status === "string" ? profile.marital_status : "") || "";
  const spoken = asStringList(profile.known_languages).join(", ");
  const hobbies = asStringList(profile.hobby_list).join(", ") || (hasValue(profile.hobbies) ? dash(profile.hobbies) : "");
  const liveNow = placeLine(profile.current_city, profile.current_state, profile.current_country);
  const bornOn = formatDob(profile.date_of_birth);
  const bornAt = birthTimeLabel(profile.birth_time);
  const who = asProfileType(profile.profile_type) === "vadhu" ? "She" : asProfileType(profile.profile_type) === "vara" ? "He" : "This member";
  const religion = nestedName(profile.religions);
  const community = nestedName(profile.communities);

  const details = [
    {
      icon: "✦",
      title: "Personal",
      wide: true,
      lines: linesOf(
        profile.height_cm ? `${who} is ${profile.height_cm} cm tall` : null,
        religion && community
          ? `${who} is ${religion} and belongs to the ${community} community`
          : religion
            ? `${who} is ${religion}`
            : community
              ? `${who} belongs to the ${community} community`
              : null,
        hasValue(profile.mother_tongue) ? `Mother tongue is ${dash(profile.mother_tongue)}` : null,
        spoken ? `${who} speaks ${spoken}` : null,
        grewUpSentence(who, profile.grew_up_in, profile.native_country, profile.current_country),
        liveNow ? `${who} now lives in ${liveNow}` : null,
        yesNo(profile.willing_to_relocate) === "Yes"
          ? `${who} is open to relocating`
          : yesNo(profile.willing_to_relocate) === "No"
            ? `${who} is not looking to relocate`
            : null,
      ),
      items: factsOf(
        fact("Marital status", marital),
        fact("Diet", profile.diet),
        fact("Blood group", profile.blood_group),
        fact("Disability", profile.physical_status),
        fact("Health", profile.health_notes),
        hobbies ? { k: "Hobbies", v: hobbies } : null,
        fact("Sub-community", profile.sub_community),
        fact("Gothra", profile.gotra),
        fact("Kuladevata", profile.kuladevata),
        fact("Living arrangement", profile.living_arrangement),
        fact("Citizenship", profile.citizenship),
        fact("Pin code", profile.pin_code),
      ),
      note: about,
    },
    {
      icon: "◎",
      title: "Education & work",
      lines: linesOf(
        hasValue(profile.qualification) && hasValue(profile.college_name)
          ? `${who} completed ${dash(profile.qualification)} from ${dash(profile.college_name)}`
          : hasValue(profile.qualification)
            ? `${who} completed ${dash(profile.qualification)}`
            : hasValue(profile.college_name)
              ? `${who} studied at ${dash(profile.college_name)}`
              : null,
        hasValue(profile.occupation) && hasValue(profile.employer_name)
          ? `${who} works as ${asRole(profile.occupation)} at ${dash(profile.employer_name)}`
          : hasValue(profile.occupation)
            ? `${who} works as ${asRole(profile.occupation)}`
            : null,
      ),
      items: factsOf(
        fact("Employed in", profile.employed_in),
        fact("Income", profile.income_band),
        fact("Settle abroad", profile.settle_abroad),
        fact("Ambition", profile.future_ambition),
      ),
    },
    {
      icon: "⌂",
      title: "Family",
      lines: linesOf(
        hasValue(profile.family_type) ? `This is a ${asRole(profile.family_type)} family` : null,
        hasValue(profile.family_location) ? `The family lives in ${dash(profile.family_location)}` : null,
        parentSentence(profile.father_name, profile.father_occupation, "Father"),
        parentSentence(profile.mother_name, profile.mother_occupation, "Mother"),
        siblingSummary("brother", profile.brothers_count, profile.brothers_married_count),
        siblingSummary("sister", profile.sisters_count, profile.sisters_married_count),
      ),
      items: factsOf(fact("Living standard", profile.family_status)),
      note: familyAbout,
    },
    {
      icon: "☽",
      title: "Kundali",
      wide: true,
      lines: linesOf(
        bornOn ? `Date of birth is ${bornOn}` : null,
        hasValue(profile.birth_city) && bornAt
          ? `Born in ${dash(profile.birth_city)} at ${bornAt}`
          : hasValue(profile.birth_city)
            ? `Born in ${dash(profile.birth_city)}`
            : bornAt
              ? `Time of birth is ${bornAt}`
              : null,
      ),
      items: factsOf(
        fact("Rashi", profile.rashi),
        fact("Lagna", profile.lagna),
        fact("Nakshatra", profile.nakshatra),
        fact("Nakshatra pada", profile.nakshatra_pada),
        fact("Gana", profile.gana),
        fact("Yoni", profile.yoni_animal),
        fact("Mangalik", profile.manglik),
      ),
    },
  ].filter((group) => group.lines.length || group.items.length || group.note);

  const hope = [
    { k: "Age", v: profile.pref_age_min && profile.pref_age_max ? `${profile.pref_age_min}–${profile.pref_age_max}` : "—" },
    { k: "Height", v: profile.pref_height_min && profile.pref_height_max ? `${profile.pref_height_min}–${profile.pref_height_max} cm` : "—" },
    { k: "Marital status", v: hopeDisplay(hopeValues(profile, "pref_maritals"), "Any") },
    { k: "Languages", v: hopeDisplay(hopeValues(profile, "pref_tongues"), "Any") },
    { k: "Religion", v: hopeDisplay(hopeValues(profile, "pref_religions"), "Any") },
    { k: "Community", v: hopeDisplay(hopeValues(profile, "pref_communities"), "Any") },
    { k: "Country", v: hopeDisplay(hopeValues(profile, "pref_countries"), "Any") },
    { k: "State", v: hopeDisplay(hopeValues(profile, "pref_states"), "Any") },
    { k: "City", v: hopeDisplay(hopeValues(profile, "pref_cities"), "Any") },
    { k: "Education", v: hopeDisplay(hopeValues(profile, "pref_educations"), "Any") },
    { k: "Occupation", v: hopeDisplay(hopeValues(profile, "pref_occupations"), "Any") },
    { k: "Employed in", v: hopeDisplay(hopeValues(profile, "pref_employed"), "Any") },
    { k: "Income", v: hopeDisplay(hopeValues(profile, "pref_incomes"), "Any") },
    { k: "Diet", v: hopeDisplay(hopeValues(profile, "pref_diets"), "Any") },
    { k: "Horoscope", v: dash(profile.pref_horoscope) },
  ];

  const photoUrls = photos.map((p) => publicMediaUrl(p.storage_path)).filter((url): url is string => Boolean(url));
  const videoUrls = videos.map((v) => publicMediaUrl(v.storage_path)).filter((url): url is string => Boolean(url));
  const voiceUrls = voices.map((v) => publicMediaUrl(v.storage_path)).filter((url): url is string => Boolean(url));

  const headline = profileHeadline(profile.subject_full_name, profile.surname);
  const props: ProfileData = {
    id: String(profile.id),
    name: headline.name,
    surname: headline.surname,
    age,
    place,
    lastSeen: Boolean(profile.hide_last_seen) && !own && !isStaff ? null : lastSeen,
    photos,
    photoUrl: photoUrls[0] ?? null,
    photoUrls,
    videoUrls,
    voiceUrls,
    memberCode,
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
