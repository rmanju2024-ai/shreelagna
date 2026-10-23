import { pickPrimaryPhotoMap } from "@/lib/match/inbox-card";

/** Columns Search needs for cards + ranking — skip bios and unused joins. */
export const BROWSE_PROFILE_COLUMNS = [
  "id",
  "created_by",
  "created_at",
  "is_complete",
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
export const LOOK_PROFILE_SELECT =
  "id, created_by, created_at, profile_type, status, is_complete, member_code, subject_full_name, surname, hide_last_seen, last_seen_at, date_of_birth, height_cm, marital_status, diet, qualification, occupation, income_band, employed_in, employer_name, current_country, current_state, current_city, native_state, native_country, birth_city, birth_time, college_name, hobbies, about, pref_notes, pref_age_min, pref_age_max, brothers_count, sisters_count, father_occupation, mother_occupation, family_status, family_location, physical_status, living_arrangement, community_id, prefer_not_community, subject_mobile, phone_otp_verified_at, religions(name), communities(name)";
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

const PHOTO_ALBUM_MAX = 3;

/** Up to three approved photos per profile, primary first. Extra photos are optional. */
export async function loadBrowsePhotoLists(db: unknown, ids: string[]): Promise<Map<string, string[]>> {
  const lists = new Map<string, string[]>();
  if (!ids.length) return lists;
  type MediaQuery = {
    from: (table: string) => {
      select: (cols: string) => {
        eq: (col: string, value: string) => {
          eq: (col: string, value: string) => {
            in: (
              col: string,
              values: string[],
            ) => {
              order: (
                col: string,
                opts: { ascending: boolean },
              ) => Promise<{ data: PhotoRow[] | null; error: unknown }>;
            };
          };
          in: (
            col: string,
            values: string[],
          ) => {
            order: (
              col: string,
              opts: { ascending: boolean },
            ) => Promise<{ data: PhotoRow[] | null; error: unknown }>;
          };
        };
      };
    };
  };
  const client = db as MediaQuery;
  const photos = (kind: "approved" | "any") => {
    const base = client.from("media").select("profile_id, storage_path, is_primary").eq("kind", "photo");
    return kind === "approved"
      ? base.eq("status", "approved").in("profile_id", ids).order("is_primary", { ascending: false })
      : base.in("profile_id", ids).order("is_primary", { ascending: false });
  };
  const approved = await photos("approved");
  const rows = approved.error ? ((await photos("any")).data ?? []) : (approved.data ?? []);
  for (const row of rows) {
    const id = String(row.profile_id ?? "");
    const path = typeof row.storage_path === "string" ? row.storage_path : "";
    if (!id || !path) continue;
    const list = lists.get(id) ?? [];
    if (list.includes(path) || list.length >= PHOTO_ALBUM_MAX) {
      lists.set(id, list);
      continue;
    }
    if (row.is_primary) list.unshift(path);
    else list.push(path);
    lists.set(id, list.slice(0, PHOTO_ALBUM_MAX));
  }
  return lists;
}
