import { CITIES_BY_STATE, EDUCATION_OPTIONS, EMPLOYED_IN, FAMILY_TYPES, HEIGHT_CM_OPTIONS, HOPE_INCOME_BANDS, INCOME_BANDS, OCCUPATION_OPTIONS, specificEducations } from "@/lib/profile/catalog";
import { GOTRA_CHOICES } from "@/lib/profile/gotras";
import {
  BLOOD_GROUPS,
  CREATOR_ROLES,
  DIETS,
  FAMILY_STATUSES,
  GANAS,
  HOBBY_OPTIONS,
  HOPE_COUNTRIES,
  HOROSCOPE_PREF,
  INDIAN_STATES,
  MANGLIK_OPTIONS,
  MARITAL_STATUSES,
  MOTHER_TONGUES,
  NAKSHATRA_PADAS,
  NAKSHATRAS,
  NATIVE_COUNTRIES,
  PHYSICAL_STATUSES,
  PREF_MANAGED,
  RASHIS,
  RESIDENCY_STATUSES,
  YONI_ANIMALS,
} from "@/lib/profile/options";
import { compareLabel, emptyFormLists, sortLabels, type FormLists } from "@/lib/profile/form-lists";

function take(loaded: string[] | undefined, seed: readonly string[], sort: "alpha" | "keep" = "keep"): string[] {
  const src = loaded?.length ? loaded : [...seed];
  return sort === "alpha" ? sortLabels(src) : [...src];
}

export function listsFromSeed(): FormLists {
  return {
    states: [...INDIAN_STATES],
    cities: Object.entries(CITIES_BY_STATE).flatMap(([state, names]) =>
      names.map((name) => ({ state, name })),
    ),
    educations: [...EDUCATION_OPTIONS],
    occupations: [...OCCUPATION_OPTIONS],
    tongues: [...MOTHER_TONGUES],
    diets: [...DIETS],
    heights: [...HEIGHT_CM_OPTIONS],
    marital: MARITAL_STATUSES.map((m) => ({ value: m.value, label: m.label })),
    incomes: [...INCOME_BANDS],
    hopeIncomes: [...HOPE_INCOME_BANDS],
    employedIn: [...EMPLOYED_IN],
    families: [...FAMILY_TYPES],
    familyStatuses: [...FAMILY_STATUSES],
    physicalStatuses: [...PHYSICAL_STATUSES],
    bloodGroups: [...BLOOD_GROUPS],
    hobbies: [...HOBBY_OPTIONS],
    countries: [...NATIVE_COUNTRIES],
    hopeCountries: [...HOPE_COUNTRIES],
    residency: [...RESIDENCY_STATUSES],
    gotras: [...GOTRA_CHOICES],
    prefManaged: [...PREF_MANAGED],
    horoscopePref: [...HOROSCOPE_PREF],
    creatorRoles: CREATOR_ROLES.map((r) => ({ value: r.value, label: r.label, hint: r.hint })),
    rashis: [...RASHIS],
    nakshatras: [...NAKSHATRAS],
    nakshatraPadas: [...NAKSHATRA_PADAS],
    ganas: [...GANAS],
    yoniAnimals: [...YONI_ANIMALS],
    manglik: [...MANGLIK_OPTIONS],
  };
}

export function enrichFormLists(loaded: FormLists): FormLists {
  const seed = listsFromSeed();
  const educations = specificEducations(loaded.educations.length ? loaded.educations : seed.educations);
  const citySource = loaded.cities.length ? loaded.cities : seed.cities;
  const cities = [...citySource].sort((a, b) => {
    const state = compareLabel(a.state, b.state);
    return state || compareLabel(a.name, b.name);
  });
  return {
    ...emptyFormLists(),
    states: take(loaded.states, seed.states, "alpha"),
    cities,
    educations: sortLabels(educations),
    occupations: take(loaded.occupations, seed.occupations, "alpha"),
    tongues: take(loaded.tongues, seed.tongues, "alpha"),
    diets: take(loaded.diets, seed.diets, "alpha"),
    heights: [...(loaded.heights.length ? loaded.heights : seed.heights)].sort((a, b) => a - b),
    marital: loaded.marital.length ? loaded.marital : seed.marital,
    incomes: take(loaded.incomes, seed.incomes),
    hopeIncomes: take(loaded.hopeIncomes, seed.hopeIncomes),
    employedIn: take(loaded.employedIn, seed.employedIn),
    families: take(loaded.families, seed.families),
    familyStatuses: take(loaded.familyStatuses, seed.familyStatuses),
    physicalStatuses: take(loaded.physicalStatuses, seed.physicalStatuses),
    bloodGroups: take(loaded.bloodGroups, seed.bloodGroups),
    hobbies: take(loaded.hobbies, seed.hobbies, "alpha"),
    countries: take(loaded.countries, seed.countries),
    hopeCountries: take(loaded.hopeCountries, seed.hopeCountries),
    residency: take(loaded.residency, seed.residency),
    gotras: take(loaded.gotras, seed.gotras),
    prefManaged: take(loaded.prefManaged, seed.prefManaged),
    horoscopePref: take(loaded.horoscopePref, seed.horoscopePref),
    creatorRoles: loaded.creatorRoles.length ? loaded.creatorRoles : seed.creatorRoles,
    rashis: take(loaded.rashis, seed.rashis),
    nakshatras: take(loaded.nakshatras, seed.nakshatras),
    nakshatraPadas: take(loaded.nakshatraPadas, seed.nakshatraPadas),
    ganas: take(loaded.ganas, seed.ganas),
    yoniAnimals: take(loaded.yoniAnimals, seed.yoniAnimals),
    manglik: take(loaded.manglik, seed.manglik),
  };
}
