import type { SupabaseClient } from "@supabase/supabase-js";

/** Profiles the member blocked, plus profiles that blocked the member. Neither side should appear in the other's inbox. */
export async function loadBlockedProfileIds(db: SupabaseClient, ownIds: string[]): Promise<Set<string>> {
  if (!ownIds.length) return new Set();
  const list = ownIds.join(",");
  const { data } = await db
    .from("member_blocks")
    .select("blocker_profile_id, blocked_profile_id")
    .or(`blocker_profile_id.in.(${list}),blocked_profile_id.in.(${list})`);
  const own = new Set(ownIds);
  const out = new Set<string>();
  for (const row of data ?? []) {
    out.add(own.has(row.blocker_profile_id as string) ? (row.blocked_profile_id as string) : (row.blocker_profile_id as string));
  }
  return out;
}
