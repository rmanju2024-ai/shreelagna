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
import { maritalLabel, NATIVE_COUNTRIES, HOPE_ANY, MOTHER_TONGUES } from "@/lib/profile/options";
import { asStringList, hopeDisplay, hopeValues, languagesKnown } from "@/lib/profile/multi-values";
import { aboutPlainText } from "@/lib/profile/about-html";
import { hopeComparisons, matchSelfFromProfile, preferenceFitScore } from "@/lib/profile/match-compare";

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
  if (hasValue(name) && hasValue(work)) return `${who} is **${dash(name)}**, working as ${dash(work)}`;
  if (hasValue(name)) return `${who} is **${dash(name)}**`;
  if (hasValue(work)) return `${who}'s work is ${dash(work)}`;
  return null;
}

function siblingPair(brothers: unknown, brothersMarried: unknown, sisters: unknown, sistersMarried: unknown): string | null {
  const b = asCount(brothers);
  const s = asCount(sisters);
  if (b === null && s === null) return null;
  const bm = asCount(brothersMarried);
  const sm = asCount(sistersMarried);
  if ((b === 0 || b === null) && (s === 0 || s === null) && b !== null && s !== null) return "No brothers or sisters";
  if (b === 1 && s === 1) {
    if (bm === 0 && sm === 0) return "One brother and one sister (neither married)";
    if (bm === 1 && sm === 1) return "One brother and one sister (both married)";
    if (bm === 0 && sm === 1) return "One brother (unmarried) and one sister (married)";
    if (bm === 1 && sm === 0) return "One brother (married) and one sister (unmarried)";
    return "One brother and one sister";
  }
  const parts = [siblingSummary("brother", brothers, brothersMarried), siblingSummary("sister", sisters, sistersMarried)].filter(
    (part): part is string => Boolean(part),
  );
  return parts.length ? parts.join("; ") : null;
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
  if (married <= 0) return `${head} (none married)`;
  if (married >= total) return total === 1 ? `${head} (married)` : `${head} (${sayCount(married)} married)`;
  if (married === 1) return `${head} (one married)`;
  return `${head} (${sayCount(married)} married)`;
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

function sameLabel(a: string | null | undefined, b: string | null | undefined): boolean {
  if (!a?.trim() || !b?.trim()) return false;
  return a.trim().localeCompare(b.trim(), "en", { sensitivity: "base" }) === 0;
}

function hopeIsSet(row: Record<string, unknown>, fields: string[], anyLabel: string): boolean {
  const prefs = hopeValues(row, ...(fields as [string, ...string[]]));
  return Boolean(prefs.length && !prefs.some((item) => sameLabel(item, anyLabel)));
}

function matchBanner(mine: Record<string, unknown>, theirs: Record<string, unknown>, score: { total?: number; max?: number; label?: string } | null): string[] {
  const mySelf = matchSelfFromProfile(mine, {
    religion: nestedName(mine.religions),
    community: nestedName(mine.communities),
  });
  const theirSelf = matchSelfFromProfile(theirs, {
    religion: nestedName(theirs.religions),
    community: nestedName(theirs.communities),
  });
  const theyAsk = hopeComparisons(theirs, mySelf, score?.total);
  const iAsk = hopeComparisons(mine, theirSelf, score?.total);
  const byKey = new Map<string, string>();
  const put = (key: string, text: string) => {
    if (!byKey.has(key)) byKey.set(key, text);
  };

  if (sameLabel(mySelf.religionName, theirSelf.religionName) && mySelf.religionName) put("religion", `Both ${mySelf.religionName}`);
  if (sameLabel(mySelf.communityName, theirSelf.communityName) && mySelf.communityName) put("community", `Same community · ${mySelf.communityName}`);
  if (sameLabel(mySelf.motherTongue, theirSelf.motherTongue) && mySelf.motherTongue) put("tongue", `Same mother tongue · ${mySelf.motherTongue}`);
  if (sameLabel(mySelf.diet, theirSelf.diet) && mySelf.diet) put("diet", `Same diet · ${mySelf.diet}`);
  if (sameLabel(mySelf.currentCity, theirSelf.currentCity) && mySelf.currentCity) put("city", `Same city · ${mySelf.currentCity}`);
  else if (sameLabel(mySelf.currentState, theirSelf.currentState) && mySelf.currentState) put("state", `Same state · ${mySelf.currentState}`);
  if (sameLabel(mySelf.qualification, theirSelf.qualification) && mySelf.qualification) put("education", `Same education · ${mySelf.qualification}`);

  const axes: Array<{
    key: keyof typeof theyAsk;
    label: string;
    set: (row: Record<string, unknown>) => boolean;
  }> = [
    { key: "age", label: "age", set: (row) => row.pref_age_min != null && row.pref_age_max != null },
    { key: "height", label: "height", set: (row) => row.pref_height_min != null && row.pref_height_max != null },
    { key: "marital", label: "marital status", set: (row) => hopeIsSet(row, ["pref_maritals", "pref_marital"], HOPE_ANY.marital) },
    { key: "diet", label: "diet", set: (row) => hopeIsSet(row, ["pref_diets"], HOPE_ANY.diet) },
    { key: "tongue", label: "mother tongue", set: (row) => hopeIsSet(row, ["pref_tongues"], HOPE_ANY.language) },
    { key: "religion", label: "religion", set: (row) => hopeIsSet(row, ["pref_religions"], HOPE_ANY.religion) },
    { key: "community", label: "community", set: (row) => hopeIsSet(row, ["pref_communities"], HOPE_ANY.community) },
    { key: "country", label: "country", set: (row) => hopeIsSet(row, ["pref_countries", "pref_country"], HOPE_ANY.country) },
    { key: "state", label: "state", set: (row) => hopeIsSet(row, ["pref_states", "pref_state"], HOPE_ANY.state) },
    { key: "city", label: "city", set: (row) => hopeIsSet(row, ["pref_cities"], HOPE_ANY.city) },
    { key: "education", label: "education", set: (row) => hopeIsSet(row, ["pref_educations", "pref_education"], HOPE_ANY.education) },
    { key: "occupation", label: "work", set: (row) => hopeIsSet(row, ["pref_occupations", "pref_occupation"], HOPE_ANY.occupation) },
    { key: "employed", label: "employment", set: (row) => hopeIsSet(row, ["pref_employed"], HOPE_ANY.employed) },
    { key: "income", label: "income", set: (row) => hopeIsSet(row, ["pref_incomes"], HOPE_ANY.income) },
  ];
  for (const axis of axes) {
    const youFit = axis.set(theirs) && theyAsk[axis.key]?.match === true;
    const theyFit = axis.set(mine) && iAsk[axis.key]?.match === true;
    if (youFit && theyFit) put(axis.key, `${axis.label[0].toUpperCase()}${axis.label.slice(1)} is a match for both of you`);
    else if (theyFit) put(axis.key, `They match your hope for ${axis.label}`);
    else if (youFit) put(axis.key, `You match their hope for ${axis.label}`);
  }
  if (score?.total != null) put("kundali", `Kundali ${score.total}/${score.max ?? 36}${score.label ? ` · ${score.label}` : ""}`);
  if (byKey.has("age") && byKey.has("height")) {
    byKey.delete("age");
    byKey.delete("height");
    const rest = [...byKey.values()];
    return ["Age and height are a match", ...rest];
  }
  return [...byKey.values()];
}

export async function BrowseProfileView({
  params,
  searchParams,
  editHref,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; sent?: string; contact?: string; wa?: string; safety?: string }>;
  editHref?: string;
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
  let quotaUsed = 0;
  let quotaLimit: number | null = null;
  let awaitingReview = false;
  let interestStatus: ReturnType<typeof effectiveInterestStatus> | null = null;
  let sentByMe = false;
  let accepted = false;
  let interestId: string | null = null;
  let kundali: ReturnType<typeof kundaliScore> | null = null;
  let contact: ProfileData["contact"] = undefined;
  let shortlisted = false;
  const db = createServiceClient() ?? supabase;
  const [access, ownerRes, myProfilesRes] = await Promise.all([
    loadMembership(db, me),
    db.from("app_users").select("id, role, welcome_started_at, welcome_days, email").eq("id", profile.created_by).maybeSingle(),
    own
      ? Promise.resolve({ data: [] as Record<string, unknown>[] })
      : db.from("profiles").select("*, religions(name), communities(name)").eq("created_by", me.id),
  ]);
  needPlan = !access.live;
  const owner = ownerRes.data;
  const mineList = (myProfilesRes.data ?? []) as Record<string, unknown>[];
  const mine =
    mineList.find((row) => row.id === me.active_profile_id) ??
    mineList.find((row) => isPublicProfileStatus(typeof row.status === "string" ? row.status : null)) ??
    mineList[0] ??
    null;
  const myIds = mineList.map((row) => String(row.id)).filter((profileId) => profileId !== id);
  let chatThreadId: string | null = null;
  let chatNotes: { id: string; sender_profile_id: string; body: string; created_at: string; read_at?: string | null }[] = [];

  const targetAccessP = owner ? loadMembership(db, owner) : Promise.resolve(null);

  if (mine && String(mine.id) !== id) {
    const [interestRes, quota, blockRes, viewedRes, shortRes] = await Promise.all([
      db
        .from("interests")
        .select("id, from_profile_id, to_profile_id, status, created_at")
        .or(`from_profile_id.eq.${id},to_profile_id.eq.${id}`),
      loadInterestQuota(db, me, access, [String(mine.id)]),
      db
        .from("member_blocks")
        .select("blocker_profile_id")
        .or(
          `and(blocker_profile_id.eq.${String(mine.id)},blocked_profile_id.eq.${id}),and(blocker_profile_id.eq.${id},blocked_profile_id.eq.${String(mine.id)})`,
        )
        .limit(1),
      db
        .from("contact_views")
        .select("id")
        .eq("viewer_profile_id", String(mine.id))
        .eq("viewed_profile_id", id)
        .maybeSingle(),
      db
        .from("profile_shortlists")
        .select("owner_profile_id")
        .eq("owner_profile_id", String(mine.id))
        .eq("shortlisted_profile_id", id)
        .maybeSingle(),
    ]);
    if (blockRes.data?.length) return <UnavailableBrowse />;
    viewerType = asProfileType(mine.profile_type);
    viewerStatus = typeof mine.status === "string" ? mine.status : null;
    quotaLeft = quota.left;
    quotaUsed = quota.used;
    quotaLimit = quota.limit;
    const complete = Boolean(mine.is_complete);
    const live = isPublicProfileStatus(typeof mine.status === "string" ? mine.status : null);
    awaitingReview = complete && !live;
    const link = (interestRes.data ?? []).find(
      (row) => myIds.includes(row.from_profile_id) || myIds.includes(row.to_profile_id),
    );
    interestStatus = link ? effectiveInterestStatus(link.status, link.created_at) : null;
    sentByMe = Boolean(link && myIds.includes(link.from_profile_id));
    accepted = interestStatus === "accepted";
    interestId = typeof link?.id === "string" ? link.id : null;
    const counted = quota.touchedIds.includes(id) || sentByMe;
    needQuota = !quota.canSend && !counted;
    canSend = Boolean(complete && live && !needPlan && (quota.canSend || counted));
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

    const mode = typeof profile.contact_release_mode === "string" ? profile.contact_release_mode : "";
    const viewed = viewedRes.data;
    const revealed = Boolean(viewed) || isStaff;
    contact = {
      revealed,
      mobile: revealed && typeof profile.subject_mobile === "string" ? profile.subject_mobile.trim() : "",
      email: revealed && typeof owner?.email === "string" ? owner.email.trim() : "",
      locked: mode === "never",
      accepted,
      needPlan,
      counted: sentByMe || Boolean(viewed),
      canReveal:
        !revealed &&
        mode !== "never" &&
        !needPlan &&
        (quotaLeft === null || quotaLeft > 0 || sentByMe || Boolean(viewed) || isStaff),
      used: quotaUsed,
      left: quotaLeft,
      limit: quotaLimit,
    };
    shortlisted = Boolean(shortRes.data);
  } else if (own) {
    viewerType = asProfileType(profile.profile_type);
    contact = {
      revealed: true,
      self: true,
      mobile: typeof profile.subject_mobile === "string" ? profile.subject_mobile.trim() : "",
      email: typeof me.email === "string" ? me.email.trim() : "",
      locked: false,
      accepted: true,
      needPlan: false,
      counted: true,
      canReveal: false,
      used: 0,
      left: null,
      limit: null,
    };
  }

  const targetAccess = await targetAccessP;
  const targetType = asProfileType(profile.profile_type);
  const thread = interestThreadState(interestStatus, sentByMe || Boolean(sent));
  const linkedByInterest = thread === "sent" || thread === "received" || thread === "accepted";
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
  const allowed =
    own ||
    Boolean(
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

  const yesNo = (value: unknown) => {
    if (value === true || value === "true") return "Yes";
    if (value === false || value === "false") return "No";
    return dash(value);
  };

  const marital = maritalLabel(typeof profile.marital_status === "string" ? profile.marital_status : "") || "";
  const spokenList = languagesKnown(profile);
  const spoken = spokenList.join(", ");
  const langSkip = new Set(
    [...spokenList, ...(hasValue(profile.mother_tongue) ? [dash(profile.mother_tongue)] : []), ...MOTHER_TONGUES].map((item) =>
      item.toLowerCase(),
    ),
  );
  const hobbies = asStringList(profile.hobby_list)
    .filter((item) => !langSkip.has(item.toLowerCase()))
    .join(", ");
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
        (() => {
          const bits: string[] = [];
          if (age != null) bits.push(`${age} years old`);
          if (profile.height_cm) bits.push(`${profile.height_cm} cm tall`);
          const head = bits.length ? `${who} is ${bits.join(", ")}` : null;
          const faith = religion && community
            ? `**${religion}**, and belongs to the **${community}** community`
            : religion
              ? `**${religion}**`
              : community
                ? `belongs to the **${community}** community`
                : null;
          if (head && faith) return faith.startsWith("belongs") ? `${head} and ${faith}` : `${head}, ${faith}`;
          if (head) return head;
          if (faith) return faith.startsWith("belongs") ? `${who} ${faith}` : `${who} is ${faith}`;
          return null;
        })(),
        [
          liveNow ? `${who} now lives in ${liveNow}` : null,
          yesNo(profile.willing_to_relocate) === "Yes"
            ? `${who} is open to relocating`
            : yesNo(profile.willing_to_relocate) === "No"
              ? `${who} is not looking to relocate`
              : null,
          grewUpSentence(who, profile.grew_up_in, profile.native_country, profile.current_country),
        ]
          .filter(Boolean)
          .join(". ") || null,
      ),
      items: factsOf(
        fact("Mother tongue", profile.mother_tongue),
        spoken ? { k: "Languages known", v: spoken } : null,
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
          ? `${who} completed **${dash(profile.qualification)}** from ${dash(profile.college_name)}`
          : hasValue(profile.qualification)
            ? `${who} completed **${dash(profile.qualification)}**`
            : hasValue(profile.college_name)
              ? `${who} studied at ${dash(profile.college_name)}`
              : null,
        hasValue(profile.occupation) && hasValue(profile.employer_name) && hasValue(profile.employed_in)
          ? `${who} works as **${dash(profile.occupation)}** at **${dash(profile.employer_name)}**, ${dash(profile.employed_in).toLowerCase()}`
          : hasValue(profile.occupation) && hasValue(profile.employed_in)
            ? `${who} works as **${dash(profile.occupation)}** in a ${dash(profile.employed_in).toLowerCase()}`
            : hasValue(profile.occupation) && hasValue(profile.employer_name)
              ? `${who} works as **${dash(profile.occupation)}** at **${dash(profile.employer_name)}**`
              : hasValue(profile.occupation)
                ? `${who} works as **${dash(profile.occupation)}**`
                : hasValue(profile.employed_in)
                  ? `${who} is employed in a ${dash(profile.employed_in).toLowerCase()}`
                  : null,
      ),
      items: factsOf(
        fact("Income", profile.income_band),
        fact("Settle abroad", profile.settle_abroad),
        fact("Ambition", profile.future_ambition),
      ),
    },
    {
      icon: "⌂",
      title: "Family",
      lines: linesOf(
        hasValue(profile.family_type) && hasValue(profile.family_location)
          ? `This is a **${asRole(profile.family_type)}** family living in ${dash(profile.family_location)}`
          : hasValue(profile.family_type)
            ? `This is a **${asRole(profile.family_type)}** family`
            : hasValue(profile.family_location)
              ? `The family lives in ${dash(profile.family_location)}`
              : null,
        [parentSentence(profile.father_name, profile.father_occupation, "Father"), parentSentence(profile.mother_name, profile.mother_occupation, "Mother")]
          .filter(Boolean)
          .join(". ") || null,
        siblingPair(profile.brothers_count, profile.brothers_married_count, profile.sisters_count, profile.sisters_married_count),
      ),
      items: factsOf(fact("Living standard", profile.family_status)),
      note: familyAbout,
    },
    {
      icon: "☽",
      title: "Kundali",
      wide: true,
      lines: linesOf(
        bornOn && hasValue(profile.birth_city) && bornAt
          ? `Date of birth is **${bornOn}**, born in ${dash(profile.birth_city)} at **${bornAt}**`
          : bornOn && hasValue(profile.birth_city)
            ? `Date of birth is **${bornOn}**, born in ${dash(profile.birth_city)}`
            : bornOn && bornAt
              ? `Date of birth is **${bornOn}**, time of birth **${bornAt}**`
              : bornOn
                ? `Date of birth is **${bornOn}**`
                : hasValue(profile.birth_city) && bornAt
                  ? `Born in ${dash(profile.birth_city)} at **${bornAt}**`
                  : hasValue(profile.birth_city)
                    ? `Born in ${dash(profile.birth_city)}`
                    : bornAt
                      ? `Time of birth is **${bornAt}**`
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

  const theyAsk =
    !own && mine
      ? hopeComparisons(
          profile,
          matchSelfFromProfile(mine, {
            religion: nestedName(mine.religions),
            community: nestedName(mine.communities),
          }),
          kundali?.total,
        )
      : null;
  const hopeKey = {
    Age: "age",
    Height: "height",
    "Marital status": "marital",
    Languages: "tongue",
    Religion: "religion",
    Community: "community",
    Country: "country",
    State: "state",
    City: "city",
    Education: "education",
    Occupation: "occupation",
    "Employed in": "employed",
    Income: "income",
    Diet: "diet",
    Horoscope: "horoscope",
  } as const;
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
    { k: "Horoscope", v: kundali?.total != null ? `${kundali.total}/${kundali.max ?? 36}` : dash(profile.pref_horoscope) },
  ].map((item) => ({
    ...item,
    fit: theyAsk ? theyAsk[hopeKey[item.k as keyof typeof hopeKey]]?.match ?? null : null,
  }));
  const fitScore = theyAsk ? preferenceFitScore(Object.values(theyAsk)) : null;

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
    house: owner?.role === "admin" ? "admin" : owner?.role === "service" ? "staff" : undefined,
    shortlisted,
    own,
    editHref,
    user,
    kundali,
    interestId,
    thread,
    canSend,
    needPlan,
    needQuota,
    awaitingReview,
    quotaLeft,
    contact,
    finishHref: "/app/profiles/" + (mine?.id || me.active_profile_id || ""),
    details,
    matches: !own && mine ? matchBanner(mine, profile, kundali) : [],
    hope,
    fitScore,
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
