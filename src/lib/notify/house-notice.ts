import { deliverHouseNotice } from "@/lib/notify/deliver";

type NoticeClient = { from: (table: string) => unknown };

export async function recordCollapsibleNotice(
  supabase: NoticeClient,
  input: {
    userId: string;
    kind: string;
    title: string;
    body: string;
    href: string;
    matchProfileId?: string | null;
    forProfileId?: string | null;
    mobileHint?: string | null;
  },
): Promise<{ created: boolean }> {
  const client = supabase as { from: (table: string) => any };
  const matchId = input.matchProfileId ?? null;
  const forId = input.forProfileId ?? null;
  let existing: { id: string } | null = null;
  if (matchId) {
    let found = client
      .from("notices")
      .select("id")
      .eq("user_id", input.userId)
      .eq("kind", input.kind)
      .eq("match_profile_id", matchId);
    if (forId) found = found.eq("for_profile_id", forId);
    const row = await found.order("created_at", { ascending: false }).limit(1).maybeSingle();
    existing = row.data ?? null;
  }
  if (existing?.id) {
    // Keep the first alert. Do not mark it unread again or send another phone or laptop notice.
    await client
      .from("notices")
      .update({
        title: input.title,
        body: input.body,
        href: input.href,
      })
      .eq("id", existing.id)
      .is("read_at", null);
    return { created: false };
  }
  const inserted = await client.from("notices").insert({
    user_id: input.userId,
    kind: input.kind,
    title: input.title,
    body: input.body,
    href: input.href,
    match_profile_id: matchId,
    for_profile_id: forId,
  });
  if (inserted && typeof inserted === "object" && "error" in inserted && inserted.error) {
    return { created: false };
  }
  return { created: true };
}

export async function recordAndDeliverNotice(
  supabase: NoticeClient,
  input: {
    userId: string;
    kind: string;
    title: string;
    body: string;
    href: string;
    matchProfileId?: string | null;
    forProfileId?: string | null;
    mobileHint?: string | null;
  },
): Promise<void> {
  const { created } = await recordCollapsibleNotice(supabase, input);
  if (!created) return;
  await deliverHouseNotice({
    userId: input.userId,
    kind: input.kind,
    title: input.title,
    body: input.body,
    href: input.href,
    mobileHint: input.mobileHint,
  });
}

export function noticeProfileListed(status: string | null | undefined): boolean {
  if (!status || status === "banned") return false;
  return status !== "deleted";
}
