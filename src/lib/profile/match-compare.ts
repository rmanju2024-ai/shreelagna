import { yearsFromDob } from "@/lib/profile/completeness";
import { hopeValues } from "@/lib/profile/multi-values";
import { HOPE_ANY, maritalLabel } from "@/lib/profile/options";

export type MatchSelf = {
  ageYears: number | null;
  heightCm: number | null;
  maritalStatus: string | null;
  diet: string | null;
  motherTongue: string | null;
  religionName: string | null;
  communityName: string | null;
  currentCountry: string | null;
  currentState: string | null;
  currentCity: string | null;
  qualification: string | null;
  occupation: string | null;
  employedIn: string | null;
  incomeBand: string | null;
  photoPath?: string | null;
};

export type PreferenceRow = { k: string; v: string; match: boolean | null };

export type HopeVerdict = { match: boolean | null; you: string };

function asNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function asText(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function sameText(a: string, b: string): boolean {
  return a.localeCompare(b, "en", { sensitivity: "base" }) === 0;
}

export function listedFits(mine: string | null, prefs: string[], anyLabel: string): boolean {
  if (!prefs.length || prefs.some((p) => sameText(p, anyLabel))) return true;
  if (!mine) return false;
  return prefs.some((p) => {
    if (sameText(p, mine)) return true;
    return p.split(/[:/,]/).some((part) => sameText(part.trim(), mine));
  });
}

export function formatHeightImperial(cm: number): string {
  const total = Math.round(cm / 2.54);
  const feet = Math.floor(total / 12);
  const inches = total % 12;
  return `${feet}' ${inches}" (${cm}cm)`;
}

export function formatHeightRange(min: number | null, max: number | null): string {
  if (min == null || max == null) return "—";
  return `${formatHeightImperial(min)} to ${formatHeightImperial(max)}`;
}

export function formatAgeRange(min: number | null, max: number | null): string {
  if (min == null || max == null) return "—";
  return `${min} to ${max}`;
}

export function rangeFits(mine: number | null, min: number | null, max: number | null): boolean | null {
  if (min == null || max == null) return null;
  if (mine == null) return false;
  return mine >= min && mine <= max;
}

export function matchSelfFromProfile(
  profile: Record<string, unknown>,
  names?: { religion?: string | null; community?: string | null; photoPath?: string | null },
): MatchSelf {
  const dob = asText(profile.date_of_birth);
  return {
    ageYears: dob ? yearsFromDob(dob) : null,
    heightCm: asNumber(profile.height_cm),
    maritalStatus: asText(profile.marital_status),
    diet: asText(profile.diet),
    motherTongue: asText(profile.mother_tongue),
    religionName: names?.religion?.trim() || null,
    communityName: names?.community?.trim() || null,
    currentCountry: asText(profile.current_country),
    currentState: asText(profile.current_state),
    currentCity: asText(profile.current_city),
    qualification: asText(profile.qualification),
    occupation: asText(profile.occupation),
    employedIn: asText(profile.employed_in),
    incomeBand: asText(profile.income_band),
    photoPath: names?.photoPath?.trim() || null,
  };
}

function youOrMissing(value: string | null, fallback = "Not on your profile"): string {
  return value?.trim() || fallback;
}

export function hopeComparisons(their: Record<string, unknown>, me: MatchSelf): Record<string, HopeVerdict> {
  const ageMin = asNumber(their.pref_age_min);
  const ageMax = asNumber(their.pref_age_max);
  const heightMin = asNumber(their.pref_height_min);
  const heightMax = asNumber(their.pref_height_max);
  const maritals = hopeValues(their, "pref_maritals", "pref_marital");
  const horoscope = hopeValues(their, "pref_horoscope")[0] || "Does not matter";

  return {
    age: {
      match: rangeFits(me.ageYears, ageMin, ageMax),
      you: me.ageYears != null ? `${me.ageYears} years` : "Not on your profile",
    },
    height: {
      match: rangeFits(me.heightCm, heightMin, heightMax),
      you: me.heightCm != null ? `${me.heightCm} cm` : "Not on your profile",
    },
    marital: {
      match: listedFits(me.maritalStatus, maritals, HOPE_ANY.marital),
      you: youOrMissing(maritalLabel(me.maritalStatus) || me.maritalStatus),
    },
    diet: {
      match: listedFits(me.diet, hopeValues(their, "pref_diets"), HOPE_ANY.diet),
      you: youOrMissing(me.diet),
    },
    horoscope: {
      match: !horoscope || horoscope === "Does not matter" ? true : null,
      you: horoscope === "Does not matter" || !horoscope ? "No requirement" : "Not a personal detail",
    },
    tongue: {
      match: listedFits(me.motherTongue, hopeValues(their, "pref_tongues"), HOPE_ANY.language),
      you: youOrMissing(me.motherTongue),
    },
    religion: {
      match: listedFits(me.religionName, hopeValues(their, "pref_religions"), HOPE_ANY.religion),
      you: youOrMissing(me.religionName),
    },
    community: {
      match: listedFits(me.communityName, hopeValues(their, "pref_communities"), HOPE_ANY.community),
      you: youOrMissing(me.communityName),
    },
    country: {
      match: listedFits(me.currentCountry, hopeValues(their, "pref_countries", "pref_country"), HOPE_ANY.country),
      you: youOrMissing(me.currentCountry),
    },
    state: {
      match: listedFits(me.currentState, hopeValues(their, "pref_states", "pref_state"), HOPE_ANY.state),
      you: youOrMissing(me.currentState),
    },
    city: {
      match: listedFits(me.currentCity, hopeValues(their, "pref_cities"), HOPE_ANY.city),
      you: youOrMissing(me.currentCity),
    },
    education: {
      match: listedFits(me.qualification, hopeValues(their, "pref_educations", "pref_education"), HOPE_ANY.education),
      you: youOrMissing(me.qualification),
    },
    occupation: {
      match: listedFits(me.occupation, hopeValues(their, "pref_occupations", "pref_occupation"), HOPE_ANY.occupation),
      you: youOrMissing(me.occupation),
    },
    employed: {
      match: listedFits(me.employedIn, hopeValues(their, "pref_employed"), HOPE_ANY.employed),
      you: youOrMissing(me.employedIn),
    },
    income: {
      match: listedFits(me.incomeBand, hopeValues(their, "pref_incomes"), HOPE_ANY.income),
      you: youOrMissing(me.incomeBand),
    },
  };
}

function listedLine(values: string[], anyLabel: string): string {
  if (!values.length || values.some((v) => sameText(v, anyLabel))) return anyLabel;
  return values.join(", ");
}

export function preferenceSheetRows(their: Record<string, unknown>, me: MatchSelf): PreferenceRow[] {
  const compared = hopeComparisons(their, me);
  const maritals = hopeValues(their, "pref_maritals", "pref_marital");
  const maritalLine =
    !maritals.length || maritals.some((m) => m === HOPE_ANY.marital)
      ? "Any marital status"
      : maritals.map((m) => maritalLabel(m) || m).join(", ");
  const horoscope = hopeValues(their, "pref_horoscope")[0] || "Does not matter";
  return [
    {
      k: "Age",
      v: formatAgeRange(asNumber(their.pref_age_min), asNumber(their.pref_age_max)),
      match: compared.age.match,
    },
    {
      k: "Height",
      v: formatHeightRange(asNumber(their.pref_height_min), asNumber(their.pref_height_max)),
      match: compared.height.match,
    },
    { k: "Marital Status", v: maritalLine, match: compared.marital.match },
    { k: "Diet", v: listedLine(hopeValues(their, "pref_diets"), HOPE_ANY.diet), match: compared.diet.match },
    { k: "Horoscopic match", v: horoscope, match: compared.horoscope.match },
    {
      k: "Mother Tongue",
      v: listedLine(hopeValues(their, "pref_tongues"), HOPE_ANY.language),
      match: compared.tongue.match,
    },
    {
      k: "Religion",
      v: listedLine(hopeValues(their, "pref_religions"), HOPE_ANY.religion),
      match: compared.religion.match,
    },
    {
      k: "Community / caste",
      v: listedLine(hopeValues(their, "pref_communities"), HOPE_ANY.community),
      match: compared.community.match,
    },
    {
      k: "Country Living in",
      v: listedLine(hopeValues(their, "pref_countries", "pref_country"), HOPE_ANY.country),
      match: compared.country.match,
    },
    {
      k: "State Living in",
      v: listedLine(hopeValues(their, "pref_states", "pref_state"), HOPE_ANY.state),
      match: compared.state.match,
    },
    {
      k: "City Living in",
      v: listedLine(hopeValues(their, "pref_cities"), HOPE_ANY.city),
      match: compared.city.match,
    },
    {
      k: "Qualification",
      v: listedLine(hopeValues(their, "pref_educations", "pref_education"), HOPE_ANY.education),
      match: compared.education.match,
    },
    {
      k: "Working as",
      v: listedLine(hopeValues(their, "pref_occupations", "pref_occupation"), HOPE_ANY.occupation),
      match: compared.occupation.match,
    },
    {
      k: "Employed in",
      v: listedLine(hopeValues(their, "pref_employed"), HOPE_ANY.employed),
      match: compared.employed.match,
    },
    {
      k: "Annual Income",
      v: listedLine(hopeValues(their, "pref_incomes"), HOPE_ANY.income),
      match: compared.income.match,
    },
  ];
}

export function preferenceMatchCount(rows: PreferenceRow[]): { hit: number; total: number } {
  return { hit: rows.filter((r) => r.match === true).length, total: rows.length };
}

export function preferenceFitScore(rows: { match: boolean | null }[]): { hit: number; total: number } {
  const scored = rows.filter((row) => row.match === true || row.match === false);
  return { hit: scored.filter((row) => row.match === true).length, total: scored.length };
}

export function preferenceFits(their: Record<string, unknown>, me: MatchSelf): boolean {
  return Object.values(hopeComparisons(their, me)).every((row) => row.match !== false);
}

export function seekPronoun(profileType: string): "her" | "his" | "their" {
  if (profileType === "vadhu") return "her";
  if (profileType === "vara") return "his";
  return "their";
}
