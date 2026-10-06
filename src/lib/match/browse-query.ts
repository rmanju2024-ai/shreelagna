import { pickPrimaryPhotoMap } from "@/lib/match/inbox-card";

/** Columns Search needs for cards + ranking — skip bios and unused joins. */
export const BROWSE_PROFILE_COLUMNS = [
  "id",
  "created_by",
  "created_at",
  "profile_type",
  "status",
  "subject_full_name",
  "hide_last_seen",
  "last_seen_at",
  "date_of_birth",
  "height_cm",
  "marital_status",
  "diet",
  "mother_tongue",
  "qualification",
  "occupation",
  "employed_in",
  "income_band",
  "current_country",
  "current_state",
  "current_city",
  "native_state",
  "rashi",
  "nakshatra",
  "gana",
  "yoni_animal",
  "yoni",
  "manglik",
  "pref_age_min",
  "pref_age_max",
  "pref_height_min",
  "pref_height_max",
  "pref_maritals",
  "pref_marital",
  "pref_diets",
  "pref_horoscope",
  "pref_tongues",
  "pref_religions",
  "pref_communities",
  "pref_countries",
  "pref_country",
  "pref_states",
  "pref_state",
  "pref_cities",
  "pref_educations",
  "pref_education",
  "pref_occupations",
  "pref_occupation",
  "pref_employed",
  "pref_incomes",
  "pref_community_mode",
].join(", ") as string;

export const BROWSE_PROFILE_SELECT: string = `${BROWSE_PROFILE_COLUMNS}, religions(name), communities(name)`;
export const BROWSE_PROFILE_SELECT_STAR: string = "*, religions(name), communities(name)";
export const BROWSE_LIST_LIMIT = 60;

type PhotoRow = { profile_id: string; storage_path: string | null; is_primary?: boolean | null; error?: unknown };

export async function loadBrowsePhotoMap(db: unknown, ids: string[]): Promise<Map<string, string>> {
  if (!ids.length) return new Map();
  const client = db as {
    from: (table: string) => {
      select: (cols: string) => {
        eq: (col: string, value: string | boolean) => {
          eq: (col: string, value: string | boolean) => {
            in: (col: string, values: string[]) => Promise<PhotoRow[] | { data: PhotoRow[] | null; error: unknown }>;
          };
          in: (col: string, values: string[]) => {
            order: (col: string) => Promise<{ data: PhotoRow[] | null; error: unknown }>;
          } & Promise<{ data: PhotoRow[] | null; error: unknown }>;
        };
      };
    };
  };

  const primary = (await client
    .from("media")
    .select("profile_id, storage_path, is_primary")
    .eq("kind", "photo")
    .eq("is_primary", true)
    .in("profile_id", ids)) as { data: PhotoRow[] | null; error: unknown };

  const map = pickPrimaryPhotoMap(primary.error ? [] : (primary.data ?? []));
  const missing = ids.filter((id) => !map.has(id));
  if (!missing.length) return map;

  const fallback = (await client
    .from("media")
    .select("profile_id, storage_path, created_at, is_primary")
    .eq("kind", "photo")
    .in("profile_id", missing)
    .order("created_at")) as { data: PhotoRow[] | null; error: unknown };

  const rest = fallback.error
    ? ((((await client
        .from("media")
        .select("profile_id, storage_path")
        .eq("kind", "photo")
        .in("profile_id", missing)) as { data: PhotoRow[] | null }).data) ?? [])
    : (fallback.data ?? []);

  return pickPrimaryPhotoMap([
    ...[...map.entries()].map(([profile_id, storage_path]) => ({
      profile_id,
      storage_path,
      is_primary: true,
    })),
    ...rest,
  ]);
}
