import { yearsFromDob } from "@/lib/profile/completeness";

export type BrowseFilters = {
  ageMin: number | null;
  ageMax: number | null;
  country: string[];
  state: string[];
  city: string[];
  religion: string[];
  community: string[];
  lifestyle: string[];
  education: string[];
  income: string[];
};

export const EMPTY_BROWSE_FILTERS: BrowseFilters = {
  ageMin: null,
  ageMax: null,
  country: [],
  state: [],
  city: [],
  religion: [],
  community: [],
  lifestyle: [],
  education: [],
  income: [],
};

function asInt(value: unknown): number | null {
  const n = typeof value === "number" ? value : Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(n) ? n : null;
}

function asList(value: unknown): string[] {
  if (Array.isArray(value)) return [...new Set(value.flatMap((item) => asList(item)))];
  if (typeof value !== "string") return [];
  return [...new Set(value.split(/[|,]/).map((item) => item.trim()).filter(Boolean))];
}

export function parseBrowseFilters(params: Record<string, string | string[] | undefined>): BrowseFilters {
  return {
    ageMin: asInt(params.age_min),
    ageMax: asInt(params.age_max),
    country: asList(params.country),
    state: asList(params.state),
    city: asList(params.city),
    religion: asList(params.religion),
    community: asList(params.community),
    lifestyle: asList(params.lifestyle),
    education: asList(params.education),
    income: asList(params.income),
  };
}

export type SavedBrowseFilter = BrowseFilters & { id: string; name: string };

export function browseFiltersActive(filters: BrowseFilters): boolean {
  return Boolean(
    filters.ageMin != null ||
      filters.ageMax != null ||
      filters.country.length ||
      filters.state.length ||
      filters.city.length ||
      filters.religion.length ||
      filters.community.length ||
      filters.lifestyle.length ||
      filters.education.length ||
      filters.income.length,
  );
}

export function namedBrowseFilter(name: string, filters: BrowseFilters, id?: string): SavedBrowseFilter | null {
  const label = name.trim().replace(/\s+/g, " ").slice(0, 48);
  if (!label || !browseFiltersActive(filters)) return null;
  return { id: id || crypto.randomUUID(), name: label, ...filters };
}

export function browseFilterQuery(filters: BrowseFilters): Record<string, string> {
  const query: Record<string, string> = {};
  if (filters.ageMin != null) query.age_min = String(filters.ageMin);
  if (filters.ageMax != null) query.age_max = String(filters.ageMax);
  if (filters.country.length) query.country = filters.country.join("|");
  if (filters.state.length) query.state = filters.state.join("|");
  if (filters.city.length) query.city = filters.city.join("|");
  if (filters.religion.length) query.religion = filters.religion.join("|");
  if (filters.community.length) query.community = filters.community.join("|");
  if (filters.lifestyle.length) query.lifestyle = filters.lifestyle.join("|");
  if (filters.education.length) query.education = filters.education.join("|");
  if (filters.income.length) query.income = filters.income.join("|");
  return query;
}

export function readSavedBrowseFilters(raw: string | null | undefined): SavedBrowseFilter[] {
  if (!raw?.trim()) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((row) => {
        if (!row || typeof row !== "object") return null;
        const item = row as Record<string, unknown>;
        const name = typeof item.name === "string" ? item.name.trim() : "";
        const id = typeof item.id === "string" ? item.id : "";
        if (!name || !id) return null;
        return {
          id,
          name: name.slice(0, 48),
          ...parseBrowseFilters({
            age_min: item.ageMin != null ? String(item.ageMin) : undefined,
            age_max: item.ageMax != null ? String(item.ageMax) : undefined,
            country: item.country as string | string[] | undefined,
            state: item.state as string | string[] | undefined,
            city: item.city as string | string[] | undefined,
            religion: item.religion as string | string[] | undefined,
            community: item.community as string | string[] | undefined,
            lifestyle: item.lifestyle as string | string[] | undefined,
            education: item.education as string | string[] | undefined,
            income: item.income as string | string[] | undefined,
          }),
        };
      })
      .filter((row): row is SavedBrowseFilter => Boolean(row));
  } catch {
    return [];
  }
}

function inList(value: string | null | undefined, expected: string[]): boolean {
  if (!expected.length) return true;
  const have = (value ?? "").trim().toLowerCase();
  return expected.some((item) => item.trim().toLowerCase() === have);
}

export function profileFitsBrowse(
  profile: {
    date_of_birth?: string | null;
    current_country?: string | null;
    current_state?: string | null;
    current_city?: string | null;
    religion_name?: string | null;
    community_name?: string | null;
    diet?: string | null;
    qualification?: string | null;
    income_band?: string | null;
  },
  filters: BrowseFilters,
): boolean {
  const age = profile.date_of_birth ? yearsFromDob(profile.date_of_birth) : null;
  if (filters.ageMin != null && (age == null || age < filters.ageMin)) return false;
  if (filters.ageMax != null && (age == null || age > filters.ageMax)) return false;
  if (!inList(profile.current_country, filters.country)) return false;
  if (!inList(profile.current_state, filters.state)) return false;
  if (!inList(profile.current_city, filters.city)) return false;
  if (!inList(profile.religion_name, filters.religion)) return false;
  if (!inList(profile.community_name, filters.community)) return false;
  if (!inList(profile.diet, filters.lifestyle)) return false;
  if (!inList(profile.qualification, filters.education)) return false;
  if (!inList(profile.income_band, filters.income)) return false;
  return true;
}
