import { deliverHouseNotice } from "@/lib/notify/deliver";

type NoticeClient = { from: (table: string) => unknown };

const ONCE_KINDS = new Set([
  "profile_view",
  "contact_view",
  "shortlist",
  "match",
  "interest_received",
]);

export async function recordCollapsibleNotice(
  supabase: NoticeClient,
  input: {
    userId: string;
    kind: string;
    title: string;
    body: string;
    href: string;
    matchProfileId?: string | null;
    mobileHint?: string | null;
  },
): Promise<{ created: boolean }> {
  const client = supabase as { from: (table: string) => any };
  const matchId = input.matchProfileId ?? null;
  let existing: { id: string } | null = null;
  if (matchId) {
    const found = await client
      .from("notices")
      .select("id")
      .eq("user_id", input.userId)
      .eq("kind", input.kind)
      .eq("match_profile_id", matchId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    existing = found.data ?? null;
  }
  const now = new Date().toISOString();
  if (existing?.id) {
    await client
      .from("notices")
      .update({
        created_at: now,
        read_at: null,
        title: input.title,
        body: input.body,
        href: input.href,
      })
      .eq("id", existing.id);
    return { created: false };
  }
  await client.from("notices").insert({
    user_id: input.userId,
    kind: input.kind,
    title: input.title,
    body: input.body,
    href: input.href,
    match_profile_id: matchId,
  });
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
    mobileHint?: string | null;
  },
): Promise<void> {
  const { created } = await recordCollapsibleNotice(supabase, input);
  if (!created && ONCE_KINDS.has(input.kind)) return;
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
