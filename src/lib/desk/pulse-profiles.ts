import type { ProfilePulseRow } from "@/lib/desk/breakdown";

const HEALTH =
  "id, profile_type, status, date_of_birth, native_state, current_state, current_city, native_country, current_country, citizenship, occupation, marital_status, income_band, qualification, last_seen_at, about, height_cm, subject_full_name, surname, subject_mobile, creator_relationship, birth_time, birth_city";
const FULL =
  "id, profile_type, status, date_of_birth, native_state, current_state, current_city, native_country, current_country, citizenship, occupation, marital_status, income_band, qualification, creator_relationship";
const BASIC =
  "id, profile_type, status, date_of_birth, native_state, current_city, occupation, marital_status, income_band, qualification, creator_relationship";

type SelectResult = PromiseLike<{ data: ProfilePulseRow[] | null; error: unknown }>;
type Db = {
  from: (table: string) => {
    select: (cols: string) => { limit: (n: number) => SelectResult };
  };
};

export async function fetchPulseProfiles(db: Db): Promise<ProfilePulseRow[]> {
  for (const cols of [HEALTH, FULL, BASIC]) {
    const result = await db.from("profiles").select(cols).limit(800);
    if (!result.error) return result.data ?? [];
  }
  return [];
}

export async function fetchPulseMedia(db: Db): Promise<{ profile_id?: string | null; kind?: string | null; status?: string | null }[]> {
  const result = await db.from("media").select("profile_id, kind, status").limit(2000);
  return result.error ? [] : result.data ?? [];
}

type PresenceResult = PromiseLike<{
  data: { user_id?: string | null; day?: string | null }[] | null;
  error: unknown;
}>;
type FilterDb = {
  from: (table: string) => {
    select: (cols: string) => {
      gte: (col: string, value: string) => {
        lte: (col: string, value: string) => { limit: (n: number) => PresenceResult };
      };
    };
  };
};

export async function fetchWeekPresence(
  db: FilterDb,
  weekStart: string,
  today: string,
): Promise<{ user_id?: string | null; day?: string | null }[]> {
  const result = await db.from("presence_days").select("user_id, day").gte("day", weekStart).lte("day", today).limit(20000);
  return result.error ? [] : result.data ?? [];
}
