import { cache } from "react";
import { unstable_cache } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { uniqueCommunities } from "@/lib/profile/communities";
import { emptyFormLists, type FormLists } from "@/lib/profile/form-lists";
import { enrichFormLists } from "@/lib/profile/form-lists-seed";
import { createClient, createServiceClient } from "@/lib/supabase/server";

type NameRow = { name?: string | null };
type KindRow = { kind?: string | null; name?: string | null; code?: string | null; hint?: string | null };
type StateRow = { id: string; name: string };
type CityRow = { name: string; state_id: string };
type MaritalRow = { value: string; label: string };
type HeightRow = { cm: number };

function names(rows: NameRow[] | null | undefined): string[] {
  return (rows ?? []).map((row) => row.name).filter((name): name is string => Boolean(name));
}

function namesOf(rows: KindRow[] | null | undefined, kind: string): string[] {
  return (rows ?? []).filter((row) => row.kind === kind && row.name).map((row) => row.name as string);
}

async function table<T>(
  supabase: SupabaseClient,
  from: string,
  columns: string,
  orderBy: string,
): Promise<T[]> {
  const { data, error } = await supabase.from(from).select(columns).order(orderBy);
  if (error || !data) return [];
  return data as T[];
}

async function loadLookups(supabase: SupabaseClient): Promise<Partial<FormLists>> {
  const [states, cities, educations, occupations, tongues, diets, heights, marital, astronomy, options] =
    await Promise.all([
      table<StateRow>(supabase, "lookup_states", "id, name", "sort_order"),
      table<CityRow>(supabase, "lookup_cities", "name, state_id", "sort_order"),
      table<NameRow>(supabase, "lookup_educations", "name", "sort_order"),
      table<NameRow>(supabase, "lookup_occupations", "name", "sort_order"),
      table<NameRow>(supabase, "lookup_tongues", "name", "sort_order"),
      table<NameRow>(supabase, "lookup_diets", "name", "sort_order"),
      table<HeightRow>(supabase, "lookup_heights", "cm", "cm"),
      table<MaritalRow>(supabase, "lookup_marital", "value, label", "sort_order"),
      table<KindRow>(supabase, "lookup_astronomy", "kind, name", "sort_order"),
      table<KindRow>(supabase, "lookup_options", "kind, name, code, hint", "sort_order"),
    ]);

  const stateName = new Map(states.map((row) => [row.id, row.name]));
  const cityRows = cities
    .map((row) => ({ state: stateName.get(row.state_id) ?? "", name: row.name }))
    .filter((row) => row.state && row.name);

  const creatorRoles = options
    .filter((row) => row.kind === "creator_role" && row.code && row.name)
    .map((row) => ({
      value: row.code as string,
      label: row.name as string,
      hint: row.hint ?? "",
    }));

  return {
    states: names(states),
    cities: cityRows,
    educations: names(educations),
    occupations: names(occupations),
    tongues: names(tongues),
    diets: names(diets),
    heights: heights.map((row) => row.cm).filter((cm) => Number.isFinite(cm)),
    marital: marital.filter((row) => row.value && row.label),
    incomes: namesOf(options, "income"),
    hopeIncomes: namesOf(options, "hope_income"),
    employedIn: namesOf(options, "employed_in"),
    families: namesOf(options, "family_type"),
    familyStatuses: namesOf(options, "family_status"),
    physicalStatuses: namesOf(options, "physical_status"),
    bloodGroups: namesOf(options, "blood_group"),
    hobbies: namesOf(options, "hobby"),
    countries: namesOf(options, "country"),
    hopeCountries: namesOf(options, "hope_country"),
    residency: namesOf(options, "residency"),
    gotras: namesOf(options, "gotra"),
    prefManaged: namesOf(options, "pref_managed"),
    horoscopePref: namesOf(options, "horoscope"),
    creatorRoles,
    rashis: namesOf(astronomy, "rashi"),
    nakshatras: namesOf(astronomy, "nakshatra"),
    nakshatraPadas: namesOf(astronomy, "nakshatra_pada"),
    ganas: namesOf(astronomy, "gana"),
    yoniAnimals: namesOf(astronomy, "yoni_animal"),
    manglik: namesOf(astronomy, "manglik"),
  };
}

const cachedLookups = unstable_cache(
  async () => {
    const service = createServiceClient();
    if (!service) return {} as Partial<FormLists>;
    return loadLookups(service);
  },
  ["shreelagna-form-lookups"],
  { revalidate: 3600 },
);

const cachedFaith = unstable_cache(
  async () => {
    const service = createServiceClient();
    if (!service) return { religions: [], communities: [] };
    const [religions, communities] = await Promise.all([
      service.from("religions").select("id, name").order("name"),
      service.from("communities").select("id, name, religion_id").order("name"),
    ]);
    return {
      religions: religions.data ?? [],
      communities: uniqueCommunities(communities.data ?? []),
    };
  },
  ["shreelagna-faith-catalog"],
  { revalidate: 3600 },
);

/** Lookup tables when present; seed constants fill any empty kind. */
export const loadFormLists = cache(async (supabase?: SupabaseClient): Promise<FormLists> => {
  try {
    const loaded = supabase ? await loadLookups(supabase) : await cachedLookups();
    return enrichFormLists({ ...emptyFormLists(), ...loaded });
  } catch {
    return enrichFormLists(emptyFormLists());
  }
});

export const loadFaithCatalog = cache(async () => {
  try {
    const cached = await cachedFaith();
    if (cached.religions.length || cached.communities.length) return cached;
    const supabase = await createClient();
    const [religions, communities] = await Promise.all([
      supabase.from("religions").select("id, name").order("name"),
      supabase.from("communities").select("id, name, religion_id").order("name"),
    ]);
    return {
      religions: religions.data ?? [],
      communities: uniqueCommunities(communities.data ?? []),
    };
  } catch {
    return { religions: [], communities: [] };
  }
});
