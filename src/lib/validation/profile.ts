import { z } from "zod";
import { isAdult } from "@/lib/profile/completeness";
import { CREATOR_ROLES, HOPE_ANY, LIVING_ARRANGEMENTS, isIndiaNative } from "@/lib/profile/options";
import type { FormLists } from "@/lib/profile/form-lists";
import { citiesForState } from "@/lib/profile/form-lists";
import {
  ABOUT_HTML_MAX,
  ABOUT_MAX,
  ABOUT_MIN,
  FAMILY_NOTE_MAX,
  HOPE_NOTE_HTML_MAX,
  HOPE_NOTE_MAX,
  aboutPlainText,
} from "@/lib/profile/about-html";
import { listedHope, listedSubmitted, asStringList } from "@/lib/profile/multi-values";
import { isProfileEditSection, type ProfileEditSection } from "@/lib/profile/sections";

const roleValues = CREATOR_ROLES.map((r) => r.value) as [string, ...string[]];

export const profileFormSchema = z.object({
  id: z.string().uuid().optional().or(z.literal("")),
  creator_relationship: z.enum(roleValues),
  profile_type: z.enum(["vadhu", "vara"]),
  subject_full_name: z.string().trim().min(2).max(120),
  surname: z.string().trim().min(1).max(80),
  date_of_birth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  birth_time: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/)
    .optional()
    .or(z.literal("")),
  mother_tongue: z.string().trim().min(1),
  height_cm: z.coerce.number().int().min(120).max(220),
  marital_status: z.string().min(1),
  diet: z.string().optional(),
  native_country: z.string().trim().max(80).optional().or(z.literal("")),
  native_state: z.string().optional(),
  native_city: z.string().trim().max(80).optional().or(z.literal("")),
  current_city: z.string().trim().max(80).optional().or(z.literal("")),
  current_state: z.string().optional(),
  qualification: z.string().trim().min(2).max(80),
  occupation: z.string().trim().min(2).max(80),
  about: z.string().max(ABOUT_HTML_MAX).optional().or(z.literal("")),
  religion_id: z.string().uuid().optional().or(z.literal("")),
  community_id: z.string().uuid().optional().or(z.literal("")),
  prefer_not_community: z.boolean().optional(),
  subject_mobile: z.string().trim().regex(/^[0-9]{10,15}$/),
  employed_in: z.string().trim().max(80).optional().or(z.literal("")),
  income_band: z.string().trim().max(80).optional().or(z.literal("")),
  employer_name: z.string().trim().max(120).optional().or(z.literal("")),
  settle_abroad: z.string().trim().max(20).optional().or(z.literal("")),
  future_ambition: z.string().trim().max(120).optional().or(z.literal("")),
  family_type: z.string().trim().max(40).optional().or(z.literal("")),
  birth_city: z.string().trim().max(80).optional().or(z.literal("")),
  college_name: z.string().trim().max(160).optional().or(z.literal("")),
  hobbies: z.string().trim().max(400).optional().or(z.literal("")),
  brothers_count: z.preprocess(
    (v) => (v === "" || v == null ? undefined : v),
    z.coerce.number().int().min(0).max(15).optional(),
  ),
  sisters_count: z.preprocess(
    (v) => (v === "" || v == null ? undefined : v),
    z.coerce.number().int().min(0).max(15).optional(),
  ),
  brothers_married_count: z.preprocess(
    (v) => (v === "" || v == null ? undefined : v),
    z.coerce.number().int().min(0).max(15).optional(),
  ),
  sisters_married_count: z.preprocess(
    (v) => (v === "" || v == null ? undefined : v),
    z.coerce.number().int().min(0).max(15).optional(),
  ),
  father_name: z.string().trim().max(80).optional().or(z.literal("")),
  father_occupation: z.string().trim().max(120).optional().or(z.literal("")),
  mother_name: z.string().trim().max(80).optional().or(z.literal("")),
  mother_occupation: z.string().trim().max(120).optional().or(z.literal("")),
  siblings_note: z.preprocess(
    (v) => aboutPlainText(v == null ? "" : String(v)).slice(0, FAMILY_NOTE_MAX),
    z.string().optional().or(z.literal("")),
  ),
  family_status: z.string().trim().max(40).optional().or(z.literal("")),
  family_location: z.string().trim().max(120).optional().or(z.literal("")),
  physical_status: z.string().trim().max(40).optional().or(z.literal("")),
  health_notes: z.string().trim().max(400).optional().or(z.literal("")),
  sub_community: z.string().trim().max(80).optional().or(z.literal("")),
  blood_group: z.string().trim().max(20).optional().or(z.literal("")),
  grew_up_in: z.string().trim().max(80).optional().or(z.literal("")),
  living_arrangement: z.string().trim().max(40).optional().or(z.literal("")),
  gotra: z.string().trim().max(120).optional().or(z.literal("")),
  rashi: z.string().trim().max(40).optional().or(z.literal("")),
  lagna: z.string().trim().max(40).optional().or(z.literal("")),
  nakshatra: z.string().trim().max(40).optional().or(z.literal("")),
  nakshatra_pada: z.string().trim().max(8).optional().or(z.literal("")),
  gana: z.string().trim().max(40).optional().or(z.literal("")),
  yoni_animal: z.string().trim().max(40).optional().or(z.literal("")),
  manglik: z.string().trim().max(40).optional().or(z.literal("")),
  citizenship: z.string().trim().max(40).optional().or(z.literal("")),
  pin_code: z.string().trim().max(12).optional().or(z.literal("")),
  current_country: z.string().trim().max(80).optional().or(z.literal("")),
  hobby_list: z.array(z.string()).optional(),
  pref_age_min: z.preprocess(
    (v) => (v === "" || v == null ? undefined : v),
    z.coerce.number().int().min(21).max(80).optional(),
  ),
  pref_age_max: z.preprocess(
    (v) => (v === "" || v == null ? undefined : v),
    z.coerce.number().int().min(21).max(80).optional(),
  ),
  pref_marital: z.union([z.string(), z.array(z.string())]).optional(),
  pref_maritals: z.array(z.string()).optional(),
  pref_education: z.union([z.string(), z.array(z.string())]).optional(),
  pref_educations: z.array(z.string()).optional(),
  pref_occupation: z.union([z.string(), z.array(z.string())]).optional(),
  pref_occupations: z.array(z.string()).optional(),
  pref_country: z.union([z.string(), z.array(z.string())]).optional(),
  pref_countries: z.array(z.string()).optional(),
  pref_notes: z.string().trim().max(HOPE_NOTE_HTML_MAX).optional().or(z.literal("")),
  known_languages: z.array(z.string()).optional(),
  pref_tongues: z.array(z.string()).optional(),
  pref_religions: z.array(z.string()).optional(),
  pref_communities: z.array(z.string()).optional(),
  pref_states: z.array(z.string()).optional(),
  pref_cities: z.array(z.string()).optional(),
  pref_height_min: z.preprocess(
    (v) => (v === "" || v == null ? undefined : v),
    z.coerce.number().int().min(120).max(220).optional(),
  ),
  pref_height_max: z.preprocess(
    (v) => (v === "" || v == null ? undefined : v),
    z.coerce.number().int().min(120).max(220).optional(),
  ),
  pref_diets: z.array(z.string()).optional(),
  pref_incomes: z.array(z.string()).optional(),
  pref_employed: z.array(z.string()).optional(),
  pref_managed: z.array(z.string()).optional(),
  pref_gothra: z.array(z.string()).optional(),
  pref_horoscope: z.string().trim().max(40).optional().or(z.literal("")),
});

export type ProfileFormInput = z.infer<typeof profileFormSchema>;

function requireIndianPlace(
  lists: FormLists,
  country: string,
  state: string | undefined,
  city: string | undefined,
  which: "native" | "current",
): string | null {
  if (!isIndiaNative(country)) return null;
  if (!state || !lists.states.includes(state)) {
    return which === "native" ? "Pick a native state from the list." : "Pick a current state from the list.";
  }
  if (!city || !citiesForState(lists, state).includes(city)) {
    return which === "native"
      ? "Pick a native city from the list for that state."
      : "Pick a current city from the list for that state.";
  }
  return null;
}

function inSection(section: ProfileEditSection | undefined, owners: ProfileEditSection[]) {
  return !section || owners.includes(section);
}

export function parseProfileForm(
  raw: Record<string, unknown>,
  lists: FormLists,
  section?: ProfileEditSection,
  draft = false,
):
  | { ok: true; data: ProfileFormInput }
  | { ok: false; error: string } {
  const scoped = section && isProfileEditSection(section) ? section : undefined;
  if (draft && !scoped) {
    const cleaned = Object.fromEntries(
      Object.entries(raw).filter(([, value]) => {
        if (value == null || value === "") return false;
        if (Array.isArray(value) && value.length === 0) return false;
        return true;
      }),
    );
    const partial = profileFormSchema.partial().safeParse(cleaned);
    if (!partial.success) {
      return { ok: false, error: "Check the details entered on this step, then save the draft again." };
    }
    const d = partial.data;
    if (!d.creator_relationship) return { ok: false, error: "Choose who is registering." };
    if (!d.profile_type) return { ok: false, error: "Choose bride or groom." };
    if (!d.subject_full_name || d.subject_full_name.trim().length < 2) {
      return { ok: false, error: "Enter the full name before saving a draft." };
    }
    if (!d.date_of_birth) return { ok: false, error: "Choose the adult date of birth before saving a draft." };
    if (!isAdult(d.date_of_birth)) {
      return { ok: false, error: "Bride or groom must be at least 21 years old." };
    }
    return { ok: true, data: d as ProfileFormInput };
  }
  const parsed = (scoped ? profileFormSchema.partial() : profileFormSchema).safeParse(raw);
  if (!parsed.success) {
    const path = parsed.error.issues[0]?.path[0];
    const messages: Record<string, string> = {
      subject_mobile: "Enter a 10 to 15 digit mobile number.",
      about: `Write between ${ABOUT_MIN} and ${ABOUT_MAX} characters in the about section.`,
      date_of_birth: "Choose a full date of birth.",
      subject_full_name: "Enter the full name.",
      surname: "Enter gharane or surname.",
      height_cm: "Pick height from the list.",
      qualification: "Pick education from the list.",
      occupation: "Pick occupation from the list.",
      current_city: "Pick a current city from the list.",
      native_city: "Pick a native city from the list.",
      native_country: "Pick a native country from the list.",
      current_country: "Pick a country of residence from the list.",
      mother_tongue: "Pick a mother tongue from the list.",
      creator_relationship: "Choose who is registering.",
      profile_type: "Choose bride or groom.",
    };
    return {
      ok: false,
      error: (typeof path === "string" && messages[path]) || "Please complete every field, then save again.",
    };
  }
  const check = (owners: ProfileEditSection[]) => inSection(scoped, owners);
  const d = parsed.data;
  if (check(["personal"])) {
    if (!d.subject_full_name || d.subject_full_name.trim().length < 2) {
      return { ok: false, error: "Enter the full name." };
    }
    if (!d.surname || d.surname.trim().length < 1) {
      return { ok: false, error: "Enter gharane or surname." };
    }
    if (!d.profile_type) {
      return { ok: false, error: "Choose bride or groom." };
    }
    if (!d.subject_mobile || !/^[0-9]{10,15}$/.test(d.subject_mobile)) {
      return { ok: false, error: "Enter a 10 to 15 digit mobile number." };
    }
    if (!d.mother_tongue || !lists.tongues.includes(d.mother_tongue)) {
      return { ok: false, error: "Pick a mother tongue from the list." };
    }
    if (!d.height_cm || !lists.heights.includes(d.height_cm)) {
      return { ok: false, error: "Pick height from the list." };
    }
    if (!d.marital_status || !lists.marital.some((m) => m.value === d.marital_status)) {
      return { ok: false, error: "Pick marital status from the list." };
    }
    const nativeCountry = d.native_country || "India";
    if (!lists.countries.includes(nativeCountry)) {
      return { ok: false, error: "Pick a native country from the list." };
    }
    parsed.data.native_country = nativeCountry;
    const currentCountry = d.current_country || nativeCountry;
    if (!lists.countries.includes(currentCountry)) {
      return { ok: false, error: "Pick a country of residence from the list." };
    }
    parsed.data.current_country = currentCountry;
    if (!isIndiaNative(nativeCountry)) {
      parsed.data.native_state = undefined;
      parsed.data.native_city = "";
    }
    if (!isIndiaNative(currentCountry)) {
      parsed.data.current_state = undefined;
      parsed.data.current_city = "";
    }
    if (d.diet && !lists.diets.includes(d.diet)) {
      return { ok: false, error: "Pick a diet from the list." };
    }
    if (d.living_arrangement && !(LIVING_ARRANGEMENTS as readonly string[]).includes(d.living_arrangement)) {
      return { ok: false, error: "Pick living arrangement from the list." };
    }
    const nativePlaceError = requireIndianPlace(
      lists,
      nativeCountry,
      parsed.data.native_state,
      parsed.data.native_city,
      "native",
    );
    if (nativePlaceError) return { ok: false, error: nativePlaceError };
    const currentPlaceError = requireIndianPlace(
      lists,
      currentCountry,
      parsed.data.current_state,
      parsed.data.current_city,
      "current",
    );
    if (currentPlaceError) return { ok: false, error: currentPlaceError };
    if (d.physical_status && lists.physicalStatuses.length && !lists.physicalStatuses.includes(d.physical_status)) {
      return { ok: false, error: "Pick health / disability from the list." };
    }
    if (d.blood_group && lists.bloodGroups.length && !lists.bloodGroups.includes(d.blood_group)) {
      return { ok: false, error: "Pick a blood group from the list." };
    }
    if (d.citizenship && lists.residency.length && !lists.residency.includes(d.citizenship)) {
      return { ok: false, error: "Pick residency status from the list." };
    }
    parsed.data.known_languages = listedSubmitted(d.known_languages ?? [], lists.tongues);
    parsed.data.hobby_list = listedSubmitted(d.hobby_list ?? [], lists.hobbies);
  }
  if (check(["faith"])) {
    if (!d.date_of_birth) {
      return { ok: false, error: "Choose a full date of birth." };
    }
    if (!isAdult(d.date_of_birth)) {
      return { ok: false, error: "The bride or groom must be 21 or older." };
    }
    if (!d.birth_time) {
      return { ok: false, error: "Choose a time of birth." };
    }
    const time = d.birth_time.slice(0, 5);
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) {
      return { ok: false, error: "Choose a time of birth." };
    }
    parsed.data.birth_time = time;
    if (!d.birth_city?.trim()) {
      return { ok: false, error: "Enter the city of birth." };
    }
    if (!d.religion_id) {
      return { ok: false, error: "Pick a religion from the list." };
    }
    if (d.gotra && lists.gotras.length && !lists.gotras.includes(d.gotra)) {
      return { ok: false, error: "Pick a gothra from the list." };
    }
    if (d.rashi && !lists.rashis.includes(d.rashi)) {
      return { ok: false, error: "Pick a rashi from the list." };
    }
    if (d.lagna && !lists.rashis.includes(d.lagna)) {
      return { ok: false, error: "Pick a lagna from the list." };
    }
    if (d.nakshatra && !lists.nakshatras.includes(d.nakshatra)) {
      return { ok: false, error: "Pick a nakshatra from the list." };
    }
    if (d.nakshatra_pada && !lists.nakshatraPadas.includes(d.nakshatra_pada)) {
      return { ok: false, error: "Pick nakshatra pada from the list." };
    }
    if (d.gana && !lists.ganas.includes(d.gana)) {
      return { ok: false, error: "Pick a gana from the list." };
    }
    if (d.yoni_animal && !lists.yoniAnimals.includes(d.yoni_animal)) {
      return { ok: false, error: "Pick a yoni animal from the list." };
    }
    if (d.manglik && !lists.manglik.includes(d.manglik)) {
      return { ok: false, error: "Pick mangalik from the list." };
    }
  }
  if (check(["work"])) {
    if (!d.qualification || !lists.educations.includes(d.qualification)) {
      return { ok: false, error: "Pick education from the list." };
    }
    if (!d.occupation || !lists.occupations.includes(d.occupation)) {
      return { ok: false, error: "Pick occupation from the list." };
    }
    if (d.income_band && lists.incomes.length && !lists.incomes.includes(d.income_band)) {
      return { ok: false, error: "Pick annual income from the list." };
    }
    if (d.employed_in && lists.employedIn.length && !lists.employedIn.includes(d.employed_in)) {
      return { ok: false, error: "Pick where they work from the list." };
    }
  }
  if (check(["family"])) {
    if (!d.creator_relationship) {
      return { ok: false, error: "Choose who is registering." };
    }
    if (d.family_type && lists.families.length && !lists.families.includes(d.family_type)) {
      return { ok: false, error: "Pick family type from the list." };
    }
    if (d.family_status && lists.familyStatuses.length && !lists.familyStatuses.includes(d.family_status)) {
      return { ok: false, error: "Pick family living standard from the list." };
    }
    parsed.data.siblings_note = aboutPlainText(d.siblings_note ?? "").slice(0, FAMILY_NOTE_MAX);
  }
  if (check(["about"])) {
    const about = aboutPlainText(d.about ?? "");
    const n = about.length;
    if (n > 0 && (n < ABOUT_MIN || n > ABOUT_MAX)) {
      return { ok: false, error: `Write between ${ABOUT_MIN} and ${ABOUT_MAX} characters in the about section, or leave it empty and add a video or voice note instead.` };
    }
    parsed.data.about = about;
  }
  if (d.pref_age_min && d.pref_age_max && d.pref_age_min > d.pref_age_max) {
    return { ok: false, error: "Preferred age range should run from younger to older." };
  }
  if (d.pref_height_min && d.pref_height_max && d.pref_height_min > d.pref_height_max) {
    return { ok: false, error: "Preferred height should run from shorter to taller." };
  }
  if (!check(["partner"])) {
    return { ok: true, data: parsed.data as ProfileFormInput };
  }
  const maritalCodes = lists.marital.map((m) => m.value);
  parsed.data.pref_tongues = listedHope(d.pref_tongues ?? [], lists.tongues, HOPE_ANY.language);
  parsed.data.pref_states = listedHope(d.pref_states ?? [], lists.states, HOPE_ANY.state);
  if (parsed.data.pref_states.includes(HOPE_ANY.state)) {
    parsed.data.pref_cities = [HOPE_ANY.city];
  } else {
    const citiesInStates = lists.cities
      .filter((c) => parsed.data.pref_states?.includes(c.state))
      .map((c) => c.name);
    parsed.data.pref_cities = listedHope(d.pref_cities ?? [], citiesInStates, HOPE_ANY.city);
  }
  parsed.data.pref_religions = listedHope(d.pref_religions ?? [], religionsAllowed(d.pref_religions), HOPE_ANY.religion);
  parsed.data.pref_communities = listedHope(
    d.pref_communities ?? [],
    d.pref_communities ?? [],
    HOPE_ANY.community,
  );
  parsed.data.pref_countries = listedHope(
    d.pref_countries?.length ? d.pref_countries : asStringList(d.pref_country),
    lists.hopeCountries,
    HOPE_ANY.country,
  );
  parsed.data.pref_educations = listedHope(
    d.pref_educations?.length ? d.pref_educations : asStringList(d.pref_education),
    lists.educations,
    HOPE_ANY.education,
  );
  parsed.data.pref_occupations = listedHope(
    d.pref_occupations?.length ? d.pref_occupations : asStringList(d.pref_occupation),
    lists.occupations,
    HOPE_ANY.occupation,
  );
  parsed.data.pref_maritals = listedHope(
    d.pref_maritals?.length ? d.pref_maritals : asStringList(d.pref_marital),
    maritalCodes,
    HOPE_ANY.marital,
  );
  parsed.data.pref_diets = listedHope(d.pref_diets ?? [], lists.diets, HOPE_ANY.diet);
  parsed.data.pref_incomes = listedHope(d.pref_incomes ?? [], lists.hopeIncomes, HOPE_ANY.income);
  parsed.data.pref_employed = listedHope(
    d.pref_employed ?? [],
    lists.employedIn.length ? lists.employedIn : d.pref_employed ?? [],
    HOPE_ANY.employed,
  );
  parsed.data.pref_managed = listedHope(d.pref_managed ?? [], lists.prefManaged, HOPE_ANY.managed);
  parsed.data.pref_country = parsed.data.pref_countries?.[0];
  parsed.data.pref_education = parsed.data.pref_educations?.[0];
  parsed.data.pref_occupation = parsed.data.pref_occupations?.[0];
  parsed.data.pref_marital = parsed.data.pref_maritals?.[0];
  if (d.pref_horoscope && lists.horoscopePref.length && !lists.horoscopePref.includes(d.pref_horoscope)) {
    return { ok: false, error: "Pick whether a horoscopic match is preferred." };
  }
  const hopeNote = aboutPlainText(d.pref_notes ?? "");
  if (hopeNote.length > HOPE_NOTE_MAX) {
    return { ok: false, error: `Keep partner notes within ${HOPE_NOTE_MAX} characters.` };
  }
  parsed.data.pref_notes = hopeNote;
  return { ok: true, data: parsed.data as ProfileFormInput };
}

function religionsAllowed(chosen: string[] | undefined): string[] {
  return [...new Set((chosen ?? []).map((s) => s.trim()).filter(Boolean))];
}
