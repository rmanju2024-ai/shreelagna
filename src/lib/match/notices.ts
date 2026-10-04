import { matchFoundCopy } from "@/lib/match/alert-copy";
import { matchSelfFromProfile, preferenceFits } from "@/lib/profile/match-compare";
import { displayFirstName } from "@/lib/profile/options";
import { oppositeType, type ProfileType } from "@/lib/profile/visibility";

function nestedName(value: unknown): string | null {
  if (Array.isArray(value) && value[0] && typeof value[0] === "object" && "name" in value[0]) {
    return String((value[0] as { name: unknown }).name);
  }
  if (value && typeof value === "object" && "name" in value) {
    return String((value as { name: unknown }).name);
  }
  return null;
}

export async function recordMatchNotices(
  supabase: { from: (table: string) => unknown },
  profileId: string,
  userId: string,
) {
  const client = supabase as { from: (table: string) => any };
  const { data: mine } = await client
    .from("profiles")
    .select("*, religions(name), communities(name)")
    .eq("id", profileId)
    .maybeSingle();
  if (!mine) return;
  const type =
    mine.profile_type === "vadhu" || mine.profile_type === "vara" ? (mine.profile_type as ProfileType) : null;
  if (!type) return;
  const want = oppositeType(type);
  const { data: others } = await client
    .from("profiles")
    .select("*, religions(name), communities(name)")
    .eq("status", "active")
    .eq("is_complete", true)
    .eq("profile_type", want)
    .neq("id", profileId)
    .order("updated_at", { ascending: false })
    .limit(40);
  // Never re-announce a profile this member was already told about (read or not);
  // otherwise every visit to Alerts created fresh unread notices and the badge came back.
  const { data: known } = await client
    .from("notices")
    .select("match_profile_id")
    .eq("user_id", userId)
    .eq("kind", "match")
    .not("match_profile_id", "is", null);
  const told = new Set<string>((known ?? []).map((row: { match_profile_id: string }) => String(row.match_profile_id)));
  for (const other of others ?? []) {
    if (told.has(String(other.id))) continue;
    const candidate = matchSelfFromProfile(other, {
      religion: nestedName(other.religions),
      community: nestedName(other.communities),
    });
    if (!preferenceFits(mine, candidate)) continue;
    const copy = matchFoundCopy(displayFirstName(mine.subject_full_name ?? "there"));
    await client.from("notices").insert({
      user_id: userId,
      kind: copy.kind,
      title: copy.title,
      body: copy.body,
      href: `/browse/${other.id}`,
      match_profile_id: other.id,
    });
  }
}
