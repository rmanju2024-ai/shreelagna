export type FormLists = {
  states: string[];
  cities: { state: string; name: string }[];
  educations: string[];
  occupations: string[];
  tongues: string[];
  diets: string[];
  heights: number[];
  marital: { value: string; label: string }[];
  incomes: string[];
  hopeIncomes: string[];
  employedIn: string[];
  families: string[];
  familyStatuses: string[];
  physicalStatuses: string[];
  bloodGroups: string[];
  hobbies: string[];
  countries: string[];
  hopeCountries: string[];
  residency: string[];
  gotras: string[];
  prefManaged: string[];
  horoscopePref: string[];
  creatorRoles: { value: string; label: string; hint: string }[];
  rashis: string[];
  nakshatras: string[];
  nakshatraPadas: string[];
  ganas: string[];
  yoniAnimals: string[];
  manglik: string[];
};

export function compareLabel(a: string, b: string): number {
  return a.localeCompare(b, "en", { sensitivity: "base", numeric: true });
}

export function sortLabels(values: readonly string[]): string[] {
  return [...values].sort(compareLabel);
}

export function citiesForState(lists: FormLists, state: string | null | undefined): string[] {
  if (!state) return [];
  return sortLabels(lists.cities.filter((c) => c.state === state).map((c) => c.name));
}

export function pickListed(list: string[], preferred?: string | null): string {
  if (preferred && list.includes(preferred)) return preferred;
  return list[0] ?? "";
}

export function emptyFormLists(): FormLists {
  return {
    states: [],
    cities: [],
    educations: [],
    occupations: [],
    tongues: [],
    diets: [],
    heights: [],
    marital: [],
    incomes: [],
    hopeIncomes: [],
    employedIn: [],
    families: [],
    familyStatuses: [],
    physicalStatuses: [],
    bloodGroups: [],
    hobbies: [],
    countries: [],
    hopeCountries: [],
    residency: [],
    gotras: [],
    prefManaged: [],
    horoscopePref: [],
    creatorRoles: [],
    rashis: [],
    nakshatras: [],
    nakshatraPadas: [],
    ganas: [],
    yoniAnimals: [],
    manglik: [],
  };
}

export function listsAreReady(lists: FormLists): boolean {
  return Boolean(
    lists.states.length &&
      lists.cities.length &&
      lists.educations.length &&
      lists.occupations.length &&
      lists.tongues.length &&
      lists.diets.length &&
      lists.heights.length &&
      lists.marital.length,
  );
}

