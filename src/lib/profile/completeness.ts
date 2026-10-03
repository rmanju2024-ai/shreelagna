import { ABOUT_MIN, aboutPlainText } from "@/lib/profile/about-html";

export type CompletenessInput = {
  subjectFullName: string | null;
  surname?: string | null;
  dateOfBirth: string | null;
  currentCity: string | null;
  nativeCountry?: string | null;
  currentCountry?: string | null;
  heightCm: number | null;
  maritalStatus: string | null;
  qualification: string | null;
  occupation: string | null;
  about: string | null;
  communityId: string | null;
  preferNotCommunity: boolean;
  hasApprovedPhoto: boolean;
  hasVideo?: boolean;
  hasAudio?: boolean;
  emailOtpVerified: boolean;
  subjectMobile: string | null;
  phoneOtpVerified: boolean;
  smsOtpRequired: boolean;
  incomeBand?: string | null;
  employedIn?: string | null;
  employerName?: string | null;
  prefNotes?: string | null;
  prefAgeMin?: number | null;
  prefAgeMax?: number | null;
  birthCity?: string | null;
  birthTime?: string | null;
  collegeName?: string | null;
  hobbies?: string | null;
  brothersCount?: number | null;
  sistersCount?: number | null;
  fatherOccupation?: string | null;
  motherOccupation?: string | null;
  familyStatus?: string | null;
  familyLocation?: string | null;
  physicalStatus?: string | null;
  livingArrangement?: string | null;
};

export function yearsFromDob(dob: string, today = new Date()): number | null {
  const age = ageFromDob(dob, today);
  return age?.years ?? null;
}

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function formatBirthTime(value: string | null | undefined): string | null {
  if (!value) return null;
  const match = /^(\d{1,2}):([0-5]\d)(?::[0-5]\d)?$/.exec(value.trim());
  if (!match) return null;
  let hour = Number(match[1]);
  const minute = match[2];
  if (!Number.isFinite(hour) || hour < 0 || hour > 23) return null;
  const suffix = hour >= 12 ? "PM" : "AM";
  hour = hour % 12 || 12;
  return `${hour}:${minute} ${suffix}`;
}

export function formatBirthDate(dob: string): string | null {
  const [y, m, d] = dob.split("-").map(Number);
  if (!y || !m || !d) return null;
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

export function formatBirthWithAge(dob: string, today = new Date()): string | null {
  const age = ageFromDob(dob, today);
  const date = formatBirthDate(dob);
  if (!age || !date) return null;
  return `${date} (${age.years} years, ${age.months} months, ${age.days} days)`;
}

export function ageFromDob(
  dob: string,
  today = new Date(),
): { years: number; months: number; days: number } | null {
  const [y, m, d] = dob.split("-").map(Number);
  if (!y || !m || !d) return null;
  const birth = new Date(y, m - 1, d);
  const now = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  if (Number.isNaN(birth.getTime()) || birth > now) return null;

  let years = now.getFullYear() - birth.getFullYear();
  let months = now.getMonth() - birth.getMonth();
  let days = now.getDate() - birth.getDate();

  if (days < 0) {
    months -= 1;
    days += new Date(now.getFullYear(), now.getMonth(), 0).getDate();
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  return { years, months, days };
}

export function isAdult(dob: string, today = new Date()): boolean {
  const y = yearsFromDob(dob, today);
  return y !== null && y >= 21;
}

export function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function maxDobIso(today = new Date()): string {
  const d = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  d.setFullYear(d.getFullYear() - 21);
  return toIsoDate(d);
}

export function minDobIso(today = new Date()): string {
  const d = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  d.setFullYear(d.getFullYear() - 80);
  return toIsoDate(d);
}

export function defaultDobIso(today = new Date()): string {
  const d = new Date(today.getFullYear() - 27, 5, 15);
  return toIsoDate(d);
}

export function daysInMonth(year: number, monthIndex: number): number {
  return new Date(year, monthIndex + 1, 0).getDate();
}

export type CompletenessItem = {
  key: string;
  label: string;
  section: "about" | "personal" | "faith" | "work" | "family" | "partner" | "album";
  mandatory: boolean;
  filled: boolean;
};

function hasText(value?: string | null): boolean {
  return Boolean(value && value.trim());
}

export function completenessChecks(p: CompletenessInput): CompletenessItem[] {
  const needsCity = !p.currentCountry || p.currentCountry === "India";
  const mobileOk = Boolean(p.subjectMobile && p.subjectMobile.replace(/\D/g, "").length >= 10);
  const working =
    Boolean(p.occupation) &&
    !/student|homemaker|not working|looking for work/i.test(p.occupation ?? "") &&
    p.employedIn !== "Student";

  const items: CompletenessItem[] = [
    {
      key: "name",
      label: "Full name of the bride or groom",
      section: "personal",
      mandatory: true,
      filled: hasText(p.subjectFullName),
    },
    {
      key: "surname",
      label: "Gharane / Surname",
      section: "personal",
      mandatory: true,
      filled: hasText(p.surname),
    },
    {
      key: "dob",
      label: "Date of birth (21 or older)",
      section: "faith",
      mandatory: true,
      filled: Boolean(p.dateOfBirth && isAdult(p.dateOfBirth)),
    },
  ];
  if (needsCity) {
    items.push({
      key: "city",
      label: "Current city",
      section: "personal",
      mandatory: true,
      filled: hasText(p.currentCity),
    });
  }
  items.push(
    { key: "height", label: "Height", section: "personal", mandatory: true, filled: Boolean(p.heightCm) },
    {
      key: "marital",
      label: "Marital status",
      section: "personal",
      mandatory: true,
      filled: hasText(p.maritalStatus),
    },
    {
      key: "qualification",
      label: "Education",
      section: "work",
      mandatory: true,
      filled: hasText(p.qualification),
    },
    {
      key: "occupation",
      label: "Occupation",
      section: "work",
      mandatory: true,
      filled: hasText(p.occupation),
    },
    {
      key: "income",
      label: "Annual income",
      section: "work",
      mandatory: false,
      filled: hasText(p.incomeBand),
    },
    {
      key: "employed",
      label: "Where they work",
      section: "work",
      mandatory: false,
      filled: hasText(p.employedIn),
    },
  );
  if (working) {
    items.push({
      key: "company",
      label: "Company or organisation",
      section: "work",
      mandatory: false,
      filled: hasText(p.employerName),
    });
  }
  items.push(
    {
      key: "pref_age",
      label: "Age you hope to match",
      section: "partner",
      mandatory: false,
      filled: Boolean(p.prefAgeMin && p.prefAgeMax),
    },
    {
      key: "intro",
      label: "Add an introduction: About, a short video, or a voice note",
      section: "about",
      mandatory: true,
      filled: introChoiceCount(p) >= 1,
    },
    { key: "photo", label: "A photograph", section: "album", mandatory: true, filled: p.hasApprovedPhoto },
    { key: "email", label: "Gmail sign-in", section: "personal", mandatory: true, filled: p.emailOtpVerified },
    { key: "mobile", label: "Mobile number", section: "personal", mandatory: true, filled: mobileOk },
  );
  if (mobileOk && p.smsOtpRequired) {
    items.push({
      key: "sms",
      label: "Confirm mobile on WhatsApp",
      section: "personal",
      mandatory: true,
      filled: p.phoneOtpVerified,
    });
  }
  items.push(
    { key: "birth_city", label: "City of birth", section: "faith", mandatory: true, filled: hasText(p.birthCity) },
    { key: "birth_time", label: "Time of birth", section: "faith", mandatory: true, filled: hasText(p.birthTime) },
    {
      key: "college",
      label: "College or university",
      section: "work",
      mandatory: false,
      filled: hasText(p.collegeName),
    },
    {
      key: "living",
      label: "Living arrangement",
      section: "personal",
      mandatory: false,
      filled: hasText(p.livingArrangement),
    },
    {
      key: "family_status",
      label: "Family living standard",
      section: "family",
      mandatory: false,
      filled: hasText(p.familyStatus),
    },
    {
      key: "family_location",
      label: "Where the family lives",
      section: "family",
      mandatory: false,
      filled: hasText(p.familyLocation),
    },
    {
      key: "siblings",
      label: "Number of brothers and sisters",
      section: "family",
      mandatory: false,
      filled: p.brothersCount != null || p.sistersCount != null,
    },
    {
      key: "father",
      label: "What father does",
      section: "family",
      mandatory: false,
      filled: hasText(p.fatherOccupation),
    },
    {
      key: "mother",
      label: "What mother does",
      section: "family",
      mandatory: false,
      filled: hasText(p.motherOccupation),
    },
    { key: "health", label: "Disability", section: "family", mandatory: false, filled: hasText(p.physicalStatus) },
  );
  return items;
}

export function completenessScore(p: CompletenessInput) {
  const checks = completenessChecks(p);
  const mandatory = checks.filter((c) => c.mandatory);
  const pending = checks.filter((c) => !c.filled);
  const pct = (filled: number, total: number) => (total === 0 ? 100 : Math.round((filled / total) * 100));
  const mandatoryFilled = mandatory.filter((c) => c.filled).length;
  const overallFilled = checks.filter((c) => c.filled).length;
  return {
    checks,
    mandatoryFilled,
    mandatoryTotal: mandatory.length,
    mandatoryPct: pct(mandatoryFilled, mandatory.length),
    overallFilled,
    overallTotal: checks.length,
    overallPct: pct(overallFilled, checks.length),
    pendingMandatory: pending.filter((c) => c.mandatory),
    pendingRecommended: pending.filter((c) => !c.mandatory),
  };
}

export function isProfileComplete(p: CompletenessInput): boolean {
  return completenessChecks(p).filter((c) => c.mandatory).every((c) => c.filled);
}

export function introChoiceCount(p: CompletenessInput): number {
  const aboutOk = Boolean(p.about && aboutPlainText(p.about).length >= ABOUT_MIN);
  return [aboutOk, Boolean(p.hasVideo), Boolean(p.hasAudio)].filter(Boolean).length;
}

export function nextReviewStatus(
  current: string | null | undefined,
  complete: boolean,
  opts?: { contentChanged?: boolean },
): string {
  const now = current || "draft";
  if (now === "on_hold" || now === "hidden" || now === "banned" || now === "married") return now;
  if (now === "active" && !opts?.contentChanged) return "active";
  if (complete) return "pending_review";
  return "draft";
}

export function canInitiateConnect(args: {
  isComplete: boolean;
  status: string;
}): boolean {
  return args.isComplete && args.status === "active";
}

export function canReplyOnInboundThread(args: {
  isComplete: boolean;
  isInboundThread: boolean;
}): boolean {
  if (args.isComplete) return true;
  return args.isInboundThread;
}

export function smsOtpRequiredFromEnv(
  value = process.env.WHATSAPP_OTP_REQUIRED ?? process.env.SMS_OTP_REQUIRED,
): boolean {
  return value === "true";
}

export function completenessGaps(
  p: CompletenessInput,
): { key: string; label: string }[] {
  return completenessChecks(p)
    .filter((item) => !item.filled)
    .map(({ key, label }) => ({ key, label }));
}

function asText(value: unknown): string | null {
  return typeof value === "string" ? value : value == null ? null : String(value);
}

function asNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) return Number(value);
  return null;
}

export function completenessFromRecord(
  row: Record<string, unknown>,
  extras: {
    hasApprovedPhoto: boolean;
    emailOtpVerified: boolean;
    hasVideo?: boolean;
    hasAudio?: boolean;
    smsOtpRequired?: boolean;
  },
): CompletenessInput {
  return {
    subjectFullName: asText(row.subject_full_name),
    surname: asText(row.surname),
    dateOfBirth: asText(row.date_of_birth),
    currentCity: asText(row.current_city),
    nativeCountry: asText(row.native_country),
    currentCountry: asText(row.current_country),
    heightCm: asNumber(row.height_cm),
    maritalStatus: asText(row.marital_status),
    qualification: asText(row.qualification),
    occupation: asText(row.occupation),
    incomeBand: asText(row.income_band),
    employedIn: asText(row.employed_in),
    employerName: asText(row.employer_name),
    prefNotes: asText(row.pref_notes),
    prefAgeMin: asNumber(row.pref_age_min),
    prefAgeMax: asNumber(row.pref_age_max),
    birthCity: asText(row.birth_city),
    birthTime: asText(row.birth_time),
    collegeName: asText(row.college_name),
    hobbies: asText(row.hobbies),
    brothersCount: asNumber(row.brothers_count),
    sistersCount: asNumber(row.sisters_count),
    fatherOccupation: asText(row.father_occupation),
    motherOccupation: asText(row.mother_occupation),
    familyStatus: asText(row.family_status),
    familyLocation: asText(row.family_location),
    physicalStatus: asText(row.physical_status),
    livingArrangement: asText(row.living_arrangement),
    about: asText(row.about),
    communityId: asText(row.community_id),
    preferNotCommunity: Boolean(row.prefer_not_community),
    hasApprovedPhoto: extras.hasApprovedPhoto,
    hasVideo: extras.hasVideo,
    hasAudio: extras.hasAudio,
    emailOtpVerified: extras.emailOtpVerified,
    subjectMobile: asText(row.subject_mobile),
    phoneOtpVerified: Boolean(row.phone_otp_verified_at),
    smsOtpRequired: extras.smsOtpRequired ?? smsOtpRequiredFromEnv(),
  };
}
