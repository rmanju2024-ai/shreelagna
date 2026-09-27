import { ABOUT_MIN, aboutPlainText } from "@/lib/profile/about-html";
import { joinHope, packHopeBag } from "@/lib/profile/multi-values";
import {
  pickSectionRecord,
  SECTION_PAYLOAD_KEYS,
  type ProfileEditSection,
} from "@/lib/profile/sections";
import type { ProfileFormInput } from "@/lib/validation/profile";

export function compactRecord(record: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(record)) {
    if (value !== undefined) out[key] = value;
  }
  return out;
}

export function aboutIntroFields(about: string | null | undefined): Record<string, unknown> {
  if (typeof about !== "string") return {};
  return {
    about,
    ...(aboutPlainText(about).length >= ABOUT_MIN ? { intro_shown: "about" as const } : {}),
  };
}

export function buildProfileSaveRow(
  data: ProfileFormInput,
  identity: {
    createdBy: string;
    creatorRelationship: string;
    profileType: string;
  },
): Record<string, unknown> {
  const brothers = data.brothers_count ?? 0;
  const sisters = data.sisters_count ?? 0;
  return compactRecord({
    created_by: identity.createdBy,
    creator_relationship: identity.creatorRelationship,
    profile_type: identity.profileType,
    subject_full_name: data.subject_full_name,
    surname: data.surname || null,
    date_of_birth: data.date_of_birth,
    birth_time: data.birth_time || null,
    mother_tongue: data.mother_tongue ?? null,
    height_cm: data.height_cm,
    marital_status: data.marital_status,
    diet: data.diet ?? null,
    native_country: data.native_country || (data.subject_full_name ? "India" : undefined),
    native_state: data.native_state ?? null,
    native_city: data.native_city || null,
    current_city: data.current_city || null,
    living_arrangement: data.living_arrangement || null,
    current_state: data.current_state ?? null,
    qualification: data.qualification,
    occupation: data.occupation,
    employed_in: data.employed_in || null,
    income_band: data.income_band || null,
    employer_name: data.employer_name || null,
    settle_abroad: data.settle_abroad || null,
    future_ambition: data.future_ambition || null,
    family_type: data.family_type || null,
    birth_city: data.birth_city || null,
    college_name: data.college_name || null,
    brothers_count: data.brothers_count == null && data.sisters_count == null ? undefined : brothers,
    brothers_married_count:
      data.brothers_count == null && data.sisters_count == null
        ? undefined
        : Math.min(data.brothers_married_count ?? 0, brothers),
    sisters_count: data.brothers_count == null && data.sisters_count == null ? undefined : sisters,
    sisters_married_count:
      data.brothers_count == null && data.sisters_count == null
        ? undefined
        : Math.min(data.sisters_married_count ?? 0, sisters),
    father_name: data.father_name || null,
    father_occupation: data.father_occupation || null,
    mother_name: data.mother_name || null,
    mother_occupation: data.mother_occupation || null,
    siblings_note: data.siblings_note || null,
    family_status: data.family_status || null,
    family_location: data.family_location || null,
    physical_status: data.physical_status || null,
    health_notes: data.health_notes || null,
    sub_community: data.sub_community || null,
    blood_group: data.blood_group || null,
    grew_up_in: data.grew_up_in || null,
    gotra: data.gotra || null,
    rashi: data.rashi || null,
    lagna: data.lagna || null,
    nakshatra: data.nakshatra || null,
    nakshatra_pada: data.nakshatra_pada || null,
    gana: data.gana || null,
    yoni_animal: data.yoni_animal || null,
    manglik: data.manglik || null,
    citizenship: data.citizenship || null,
    current_country: data.current_country || null,
    hobby_list: data.hobby_list,
    hobbies: data.known_languages?.length
      ? data.known_languages.join(", ")
      : data.hobbies || null,
    pref_age_min: data.pref_age_min ?? null,
    pref_age_max: data.pref_age_max ?? null,
    pref_marital: joinHope(data.pref_maritals) || data.pref_marital || null,
    pref_maritals: data.pref_maritals,
    pref_education: joinHope(data.pref_educations) || data.pref_education || null,
    pref_educations: data.pref_educations,
    pref_occupation: joinHope(data.pref_occupations) || data.pref_occupation || null,
    pref_occupations: data.pref_occupations,
    pref_country: joinHope(data.pref_countries) || data.pref_country || null,
    pref_countries: data.pref_countries,
    pref_state: joinHope(data.pref_states),
    pref_notes: typeof data.pref_notes === "string" ? data.pref_notes || null : undefined,
    known_languages: data.known_languages,
    pref_tongues: data.pref_tongues,
    pref_religions: data.pref_religions,
    pref_communities: data.pref_communities,
    pref_states: data.pref_states,
    pref_cities: data.pref_cities,
    pref_height_min: data.pref_height_min ?? null,
    pref_height_max: data.pref_height_max ?? null,
    pref_diets: data.pref_diets,
    pref_incomes: data.pref_incomes,
    pref_employed: data.pref_employed,
    pref_managed: data.pref_managed,
    pref_horoscope: data.pref_horoscope || null,
    pref_community_mode:
      data.pref_tongues || data.pref_states || data.pref_countries || data.pref_age_min != null
        ? packHopeBag({
            pref_tongues: data.pref_tongues,
            pref_religions: data.pref_religions,
            pref_communities: data.pref_communities,
            pref_countries: data.pref_countries,
            pref_states: data.pref_states,
            pref_cities: data.pref_cities,
            pref_educations: data.pref_educations,
            pref_occupations: data.pref_occupations,
            pref_maritals: data.pref_maritals,
            pref_employed: data.pref_employed,
            pref_incomes: data.pref_incomes,
            pref_diets: data.pref_diets,
            pref_managed: data.pref_managed,
            pref_horoscope: data.pref_horoscope ? [data.pref_horoscope] : [],
          })
        : undefined,
    ...aboutIntroFields(data.about),
    religion_id: data.religion_id || null,
    community_id: data.community_id || null,
    subject_mobile: data.subject_mobile,
    status: "active",
  });
}

export function pickSaveRow(
  row: Record<string, unknown>,
  section: ProfileEditSection | undefined,
  editing: boolean,
): Record<string, unknown> {
  const compact = compactRecord(row);
  if (!section || !editing) return compact;
  return compactRecord(pickSectionRecord(compact, SECTION_PAYLOAD_KEYS[section]));
}
