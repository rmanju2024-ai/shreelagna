import type { SupabaseClient } from "@supabase/supabase-js";
import { isMissingColumnError } from "@/lib/profile/db-errors";

export async function findOwnProfile(supabase: SupabaseClient, userId: string) {
  const full = await supabase
    .from("profiles")
    .select("id, profile_type, creator_relationship, member_code")
    .eq("created_by", userId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!full.error) return full.data;
  if (!isMissingColumnError(full.error, "member_code")) return null;
  const { data } = await supabase
    .from("profiles")
    .select("id, profile_type, creator_relationship")
    .eq("created_by", userId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data;
}

export async function loadMemberCodes(supabase: SupabaseClient, ids: string[]) {
  const map = new Map<string, string>();
  if (!ids.length) return map;
  const { data, error } = await supabase.from("profiles").select("id, member_code").in("id", ids);
  if (error || !data) {
    if (error && !isMissingColumnError(error, "member_code")) {
      console.error("member codes could not load");
    }
    return map;
  }
  for (const row of data) {
    if (row.id && row.member_code) map.set(row.id, row.member_code);
  }
  return map;
}
