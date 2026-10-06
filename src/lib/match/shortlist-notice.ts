import { profileShortlistedCopy } from "@/lib/match/alert-copy";

export async function upsertShortlistNotice(
  supabase: { from: (table: string) => unknown },
  input: { ownerUserId: string; viewerProfileId: string; viewerName: string },
) {
  const client = supabase as { from: (table: string) => any };
  const copy = profileShortlistedCopy(input.viewerName);
  const now = new Date().toISOString();
  const href = `/browse/${input.viewerProfileId}`;
  const { data: existing } = await client
    .from("notices")
    .select("id")
    .eq("user_id", input.ownerUserId)
    .eq("kind", copy.kind)
    .eq("match_profile_id", input.viewerProfileId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (existing?.id) {
    await client
      .from("notices")
      .update({ created_at: now, read_at: null, title: copy.title, body: copy.body, href })
      .eq("id", existing.id);
    return;
  }
  await client.from("notices").insert({
    user_id: input.ownerUserId,
    kind: copy.kind,
    title: copy.title,
    body: copy.body,
    href,
    match_profile_id: input.viewerProfileId,
  });
}
