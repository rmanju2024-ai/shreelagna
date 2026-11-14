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

/** Keep named pins at the front, then the rest A to Z. */
export function pinThenAlpha(values: readonly string[], pins: readonly string[] = []): string[] {
  const pinSet = new Set(pins);
  const rest = sortLabels(values.filter((value) => !pinSet.has(value)));
  const head = pins.filter((pin) => values.includes(pin));
  return [...head, ...rest];
}

function sameListed(a: string, b: string): boolean {
  return a.localeCompare(b, "en", { sensitivity: "base" }) === 0;
}

/** Profile values (and India on country lists) stay first; nothing is dropped. */
export function preferListedItems<T extends { value: string; label: string }>(
  rows: readonly T[],
  prefer: readonly string[] = [],
  sortRest = true,
): T[] {
  if (!rows.length) return [];
  const used = new Set<string>();
  const head: T[] = [];
  function take(match: (row: T) => boolean) {
    for (const row of rows) {
      if (used.has(row.value)) continue;
      if (!match(row)) continue;
      used.add(row.value);
      head.push(row);
    }
  }
  take((row) => !row.value);
  take((row) => /^any\b/i.test(row.label) || /^any\b/i.test(row.value));
  take((row) => sameListed(row.value, "India") || sameListed(row.label, "India"));
  for (const raw of prefer) {
    if (!raw.trim()) continue;
    take((row) => sameListed(row.value, raw) || sameListed(row.label, raw));
  }
  const rest = rows.filter((row) => !used.has(row.value));
  if (sortRest) rest.sort((a, b) => compareLabel(a.label, b.label));
  return [...head, ...rest];
}

export function preferThenList(values: readonly string[], prefer: readonly string[] = [], sortRest = true): string[] {
  return preferListedItems(
    values.map((value) => ({ value, label: value })),
    prefer,
    sortRest,
  ).map((row) => row.value);
}

/** India stays at the top of country lists. Any-country stays above India when present. */
export function pinIndiaFirst(values: readonly string[]): string[] {
  return preferThenList(values);
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

