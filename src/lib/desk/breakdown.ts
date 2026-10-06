import { isProfileComplete, yearsFromDob } from "@/lib/profile/completeness";
import { CREATOR_ROLES, MARITAL_STATUSES } from "@/lib/profile/options";
import { WELCOME_PLAN_NAME } from "@/lib/membership/catalog";
import { formatIstDate, formatIstMonth, istDayKey, istMonthKey, parseInstant } from "@/lib/time/ist";

export type CountRow = { label: string; count: number };

export const AGE_BANDS = ["18-25", "25-30", "30-35", "35-40", "40+"] as const;
export const IDLE_BANDS = [
  "Seen this week",
  "Quiet 1–2 weeks",
  "Quiet 2–4 weeks",
  "Quiet 4 weeks–3 months",
  "Quiet 3–6 months",
  "Quiet 6 months+",
  "Never seen",
] as const;

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export type ProfilePulseRow = {
  id?: string | null;
  last_seen_at?: string | null;
  about?: string | null;
  height_cm?: number | null;
  subject_full_name?: string | null;
  surname?: string | null;
  subject_mobile?: string | null;
  birth_time?: string | null;
  birth_city?: string | null;
  profile_type?: string | null;
  status?: string | null;
  date_of_birth?: string | null;
  native_state?: string | null;
  current_state?: string | null;
  current_city?: string | null;
  native_country?: string | null;
  current_country?: string | null;
  citizenship?: string | null;
  occupation?: string | null;
  marital_status?: string | null;
  income_band?: string | null;
  qualification?: string | null;
  creator_relationship?: string | null;
  created_at?: string | null;
};

export function countBy(values: Array<string | null | undefined>, empty = "Not shared"): CountRow[] {
  const map = new Map<string, number>();
  for (const raw of values) {
    const label = String(raw ?? "").trim() || empty;
    map.set(label, (map.get(label) ?? 0) + 1);
  }
  return [...map.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

export function topCounts(rows: CountRow[], limit = 15, emptyLabel = "City not shared"): CountRow[] {
  const empty = rows.filter((row) => row.label === emptyLabel);
  const named = rows.filter((row) => row.label !== emptyLabel);
  const head = named.slice(0, limit);
  const rest = named.slice(limit);
  const other = rest.reduce((sum, row) => sum + row.count, 0);
  const out = [...head];
  if (other) out.push({ label: `Other (${rest.length})`, count: other });
  out.push(...empty);
  return out;
}

export function ageBand(years: number | null | undefined): string {
  if (years == null || !Number.isFinite(years) || years < 18) return "Not shared";
  if (years <= 25) return "18-25";
  if (years <= 30) return "25-30";
  if (years <= 35) return "30-35";
  if (years <= 40) return "35-40";
  return "40+";
}

export function livingCountry(row: ProfilePulseRow): string {
  const value = row.current_country || row.native_country || row.citizenship || "India";
  return value.trim() || "India";
}

export function isIndiaPlace(country: string): boolean {
  return country.trim().toLowerCase() === "india";
}

export function livingState(row: ProfilePulseRow): string {
  if (!isIndiaPlace(livingCountry(row))) return "";
  return (row.current_state || row.native_state || "").trim();
}

export function maritalLabel(value: string | null | undefined): string {
  const raw = String(value ?? "").trim();
  if (!raw) return "Not shared";
  return MARITAL_STATUSES.find((item) => item.value === raw)?.label ?? raw;
}

export function creatorLabel(value: string | null | undefined): string {
  const raw = String(value ?? "").trim();
  if (!raw) return "Not shared";
  if (raw === "staff") return "Staff";
  return CREATOR_ROLES.find((item) => item.value === raw)?.label ?? raw;
}

export function placeBreakdown(rows: ProfilePulseRow[]) {
  const countries = rows.map(livingCountry);
  const india = rows.filter((row) => isIndiaPlace(livingCountry(row)));
  const abroad = rows.filter((row) => !isIndiaPlace(livingCountry(row)));
  return {
    region: countBy(countries.map((country) => (isIndiaPlace(country) ? "India" : country))),
    states: countBy(india.map(livingState), "State not shared"),
    cities: topCounts(
      countBy(
        rows.map((row) => String(row.current_city ?? "").trim()),
        "City not shared",
      ),
      15,
      "City not shared",
    ),
    abroad: countBy(abroad.map(livingCountry), "Country not shared"),
    indiaCount: india.length,
    abroadCount: abroad.length,
  };
}

function orderAge(rows: CountRow[]): CountRow[] {
  const rank = new Map<string, number>(AGE_BANDS.map((band, index) => [band, index]));
  return [...rows].sort((a, b) => {
    const left = rank.get(a.label) ?? 99;
    const right = rank.get(b.label) ?? 99;
    return left - right || b.count - a.count;
  });
}

export function peopleBreakdown(rows: ProfilePulseRow[], now = new Date()) {
  return {
    profession: countBy(rows.map((row) => row.occupation)),
    age: orderAge(countBy(rows.map((row) => ageBand(yearsFromDob(String(row.date_of_birth ?? ""), now))))),
    marital: countBy(rows.map((row) => maritalLabel(row.marital_status))),
    income: countBy(rows.map((row) => row.income_band)),
    education: countBy(rows.map((row) => row.qualification)),
    createdBy: countBy(rows.map((row) => creatorLabel(row.creator_relationship))),
  };
}

export type MediaPulseRow = {
  profile_id?: string | null;
  kind?: string | null;
  status?: string | null;
};

export function idleBand(lastSeen: string | null | undefined, now = new Date()): string {
  const at = parseInstant(lastSeen);
  if (!at) return "Never seen";
  const quiet = now.getTime() - at.getTime();
  if (quiet < WEEK_MS) return "Seen this week";
  if (quiet < 2 * WEEK_MS) return "Quiet 1–2 weeks";
  if (quiet < 4 * WEEK_MS) return "Quiet 2–4 weeks";
  if (quiet < 13 * WEEK_MS) return "Quiet 4 weeks–3 months";
  if (quiet < 26 * WEEK_MS) return "Quiet 3–6 months";
  return "Quiet 6 months+";
}

function orderLabels(rows: CountRow[], labels: readonly string[]): CountRow[] {
  const rank = new Map(labels.map((label, index) => [label, index]));
  return [...rows].sort((a, b) => (rank.get(a.label) ?? 99) - (rank.get(b.label) ?? 99) || b.count - a.count);
}

function mediaFlags(rows: MediaPulseRow[]) {
  const map = new Map<string, { photo: boolean; video: boolean; audio: boolean; photoApproved: boolean }>();
  for (const row of rows) {
    const id = String(row.profile_id ?? "");
    if (!id) continue;
    const cur = map.get(id) ?? { photo: false, video: false, audio: false, photoApproved: false };
    if (row.kind === "photo") {
      cur.photo = true;
      if (row.status === "approved") cur.photoApproved = true;
    }
    if (row.kind === "video") cur.video = true;
    if (row.kind === "audio") cur.audio = true;
    map.set(id, cur);
  }
  return map;
}

export function healthBreakdown(rows: ProfilePulseRow[], mediaRows: MediaPulseRow[], now = new Date()) {
  const media = mediaFlags(mediaRows);
  const empty = { photo: false, video: false, audio: false, photoApproved: false };
  const idleMs = rows.map((row) => {
    const at = parseInstant(row.last_seen_at);
    return at ? now.getTime() - at.getTime() : Number.POSITIVE_INFINITY;
  });
  const flags = rows.map((row) => (row.id ? media.get(row.id) ?? empty : empty));
  const complete = rows.map((row, index) =>
    isProfileComplete({
      subjectFullName: row.subject_full_name ?? null,
      surname: row.surname ?? null,
      dateOfBirth: row.date_of_birth ?? null,
      currentCity: row.current_city ?? null,
      currentCountry: row.current_country ?? null,
      heightCm: row.height_cm ?? null,
      maritalStatus: row.marital_status ?? null,
      qualification: row.qualification ?? null,
      occupation: row.occupation ?? null,
      about: row.about ?? null,
      communityId: null,
      preferNotCommunity: true,
      hasApprovedPhoto: flags[index].photoApproved,
      hasVideo: flags[index].video,
      hasAudio: flags[index].audio,
      emailOtpVerified: true,
      subjectMobile: row.subject_mobile ?? null,
      phoneOtpVerified: true,
      smsOtpRequired: false,
      birthTime: row.birth_time ?? null,
      birthCity: row.birth_city ?? null,
    }),
  );

  return {
    idle: orderLabels(countBy(rows.map((row) => idleBand(row.last_seen_at, now))), IDLE_BANDS),
    inactiveWeek: idleMs.filter((ms) => ms >= WEEK_MS).length,
    inactive2Weeks: idleMs.filter((ms) => ms >= 2 * WEEK_MS).length,
    inactive4Weeks: idleMs.filter((ms) => ms >= 4 * WEEK_MS).length,
    inactive3Months: idleMs.filter((ms) => ms >= 13 * WEEK_MS).length,
    inactive6Months: idleMs.filter((ms) => ms >= 26 * WEEK_MS).length,
    completed: complete.filter(Boolean).length,
    uncompleted: complete.filter((value) => !value).length,
    video: flags.filter((row) => row.video).length,
    voice: flags.filter((row) => row.audio).length,
    photo: flags.filter((row) => row.photo).length,
    media: [
      { label: "Photo uploaded", count: flags.filter((row) => row.photo).length },
      { label: "Video uploaded", count: flags.filter((row) => row.video).length },
      { label: "Voice uploaded", count: flags.filter((row) => row.audio).length },
    ],
    status: countBy(rows.map((row) => row.status), "No status"),
  };
}

const DAY_MS = 24 * 60 * 60 * 1000;

export function createdTrend(rows: Array<{ created_at?: string | null }>, now = new Date()) {
  const stamps = rows.map((row) => parseInstant(row.created_at)).filter((at): at is Date => Boolean(at));
  const byDay = new Map<string, number>();
  const byMonth = new Map<string, number>();
  for (const at of stamps) {
    const day = istDayKey(at);
    const month = istMonthKey(at);
    byDay.set(day, (byDay.get(day) ?? 0) + 1);
    byMonth.set(month, (byMonth.get(month) ?? 0) + 1);
  }
  const daily: CountRow[] = [];
  for (let i = 6; i >= 0; i--) {
    const at = new Date(now.getTime() - i * DAY_MS);
    daily.push({ label: formatIstDate(at, false), count: byDay.get(istDayKey(at)) ?? 0 });
  }
  const monthly: CountRow[] = [];
  const [year, month] = istMonthKey(now).split("-").map(Number);
  for (let i = 11; i >= 0; i--) {
    const at = new Date(Date.UTC(year, month - 1 - i, 1));
    const key = `${at.getUTCFullYear()}-${String(at.getUTCMonth() + 1).padStart(2, "0")}`;
    monthly.push({ label: formatIstMonth(at), count: byMonth.get(key) ?? 0 });
  }
  return {
    today: byDay.get(istDayKey(now)) ?? 0,
    lastWeek: stamps.filter((at) => now.getTime() - at.getTime() < 7 * DAY_MS).length,
    lastMonth: stamps.filter((at) => now.getTime() - at.getTime() < 30 * DAY_MS).length,
    daily,
    monthly,
  };
}

export function tallyWeekPresence(
  rows: Array<{ user_id?: string | null; day?: string | null }>,
  minDays = 4,
) {
  const byUser = new Map<string, Set<string>>();
  for (const row of rows) {
    const id = String(row.user_id ?? "").trim();
    const day = String(row.day ?? "").slice(0, 10);
    if (!id || !day) continue;
    const set = byUser.get(id) ?? new Set<string>();
    set.add(day);
    byUser.set(id, set);
  }
  const ranked = [...byUser.entries()]
    .map(([userId, days]) => ({ userId, days: days.size }))
    .sort((a, b) => b.days - a.days || a.userId.localeCompare(b.userId));
  const bands = ["1 day", "2 days", "3 days", "4 days", "5 days", "6 days", "7 days"].map((label, index) => ({
    label,
    count: ranked.filter((row) => row.days === index + 1).length,
  }));
  const active = ranked.filter((row) => row.days >= minDays);
  return { ranked, bands, active, activeCount: active.length };
}

export function auditActionLabel(action: string): string {
  if (action === "ticket.status") return "Ticket status";
  if (action === "ticket.note") return "Ticket note";
  if (action === "interest.accepted") return "Interest accepted";
  if (action === "interest.declined") return "Interest declined";
  if (action === "profile.published") return "Profile published";
  if (action === "profile.status") return "Profile status";
  if (action === "profile.edit") return "Profile edited";
  if (action === "profile.translate") return "Profile translated";
  if (action === "profile.flags.clear") return "Flags cleared";
  if (action === "staff.appoint") return "Staff appointed";
  if (action === "staff.remove") return "Staff removed";
  if (action === "membership.confirm") return "Plan payment confirmed";
  if (action === "membership.decline") return "Plan payment declined";
  if (action === "membership.grant") return "Plan granted";
  if (action === "plan.save") return "Plan saved";
  if (action === "plan.add") return "Plan added";
  if (action === "membership.request") return "Plan requested";
  return action.replace(/[._]/g, " ");
}

export function houseRoleLabel(role?: string | null): string {
  if (role === "admin") return "Admin";
  if (role === "service") return "Staff";
  return "Member";
}

export type PlanUsagePaid = {
  user_id?: string | null;
  plan_code?: string | null;
  ends_at?: string | null;
};

export function planUsage(input: {
  memberCount: number;
  welcomeWindowCount: number;
  paid: PlanUsagePaid[];
  paidWelcomeOverlap: number;
  catalog: Array<{ code: string; name: string }>;
  now?: Date;
}): { rows: CountRow[]; noPlan: number; welcome: number; paidMembers: number } {
  const now = input.now ?? new Date();
  const live = input.paid.filter((row) => {
    const ends = parseInstant(row.ends_at);
    return !ends || ends.getTime() > now.getTime();
  });
  const paidUsers = new Set(
    live.map((row) => String(row.user_id ?? "").trim()).filter(Boolean),
  );
  const byCode = new Map<string, number>();
  for (const row of live) {
    const code = String(row.plan_code ?? "").trim() || "unknown";
    byCode.set(code, (byCode.get(code) ?? 0) + 1);
  }
  const catalogCodes = new Set(input.catalog.map((plan) => plan.code));
  const paidRows: CountRow[] = input.catalog.map((plan) => ({
    label: plan.name,
    count: byCode.get(plan.code) ?? 0,
  }));
  for (const [code, count] of byCode) {
    if (!catalogCodes.has(code)) paidRows.push({ label: code, count });
  }
  const welcome = Math.max(0, input.welcomeWindowCount - Math.max(0, input.paidWelcomeOverlap));
  const noPlan = Math.max(0, input.memberCount - paidUsers.size - welcome);
  return {
    paidMembers: paidUsers.size,
    welcome,
    noPlan,
    rows: [...paidRows, { label: WELCOME_PLAN_NAME, count: welcome }, { label: "No plan", count: noPlan }],
  };
}
