import Link from "next/link";
import { LiveRefresh } from "@/components/live-refresh";
import { after } from "next/server";
import { ThreadView } from "@/app/app/chat/[id]/thread-view";
import { ensureAppUser, getAuth } from "@/lib/auth/session";
import { publicMediaUrl } from "@/lib/match/inbox-card";
import { isOnlineNow } from "@/lib/profile/last-seen";
import { chatPresenceLine } from "@/lib/match/salon-thread";
import { pairCanChat } from "@/lib/match/interest-status";
import { loadMembership } from "@/lib/membership/load";
import { displayFirstName } from "@/lib/profile/options";
import { profileOpenHref } from "@/lib/ui/dismiss";
import { canSearchFamilies } from "@/lib/profile/visibility";
import { requireWorkingProfile } from "@/lib/profile/working-profile";
import { createServiceClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";

export default async function ChatThreadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, user } = await getAuth();
  if (!supabase || !user) redirect(`/login?next=/app/chat/${id}`);
  const me = await ensureAppUser(supabase, user);
  if (!me) redirect("/login?error=account");
  const working = await requireWorkingProfile(supabase, me);

  const { data: thread } = await supabase
    .from("threads")
    .select("id, profile_a, profile_b, frozen")
    .eq("id", id)
    .maybeSingle();
  if (!thread) notFound();

  const db = createServiceClient() ?? supabase;
  const { data: mineRows } = await db
    .from("profiles")
    .select("id, status")
    .eq("created_by", me.id)
    .in("id", [thread.profile_a, thread.profile_b]);
  const mine = mineRows?.find((row) => row.id === working.id) ?? null;
  if (!mine || !canSearchFamilies(mine.status)) notFound();

  const otherId = mine.id === thread.profile_a ? thread.profile_b : thread.profile_a;
  const [{ data: interestRows }, myAccess, { data: other }, { data: messages }, { data: photos }] =
    await Promise.all([
      supabase
        .from("interests")
        .select("from_profile_id, to_profile_id, status, created_at")
        .or(
          `and(from_profile_id.eq.${mine.id},to_profile_id.eq.${otherId}),and(from_profile_id.eq.${otherId},to_profile_id.eq.${mine.id})`,
        )
        .limit(8),
      loadMembership(db, me, { id: mine.id }),
      supabase
        .from("profiles")
        .select("id, subject_full_name, status, last_seen_at, hide_last_seen")
        .eq("id", otherId)
        .maybeSingle(),
      supabase
        .from("messages")
        .select("id, sender_profile_id, body, created_at, read_at, edited_at, deleted_at")
        .eq("thread_id", id)
        .order("created_at", { ascending: false })
        .limit(100)
        .then((first) =>
          first.error
            ? supabase
                .from("messages")
                .select("id, sender_profile_id, body, created_at, read_at")
                .eq("thread_id", id)
                .order("created_at", { ascending: false })
                .limit(100)
            : first,
        ),
      db
        .from("media")
        .select("storage_path, is_primary")
        .eq("profile_id", otherId)
        .eq("kind", "photo")
        .eq("status", "approved")
        .order("created_at"),
    ]);
  if (!pairCanChat(interestRows ?? [], mine.id, otherId)) notFound();
  const chatLive = myAccess.live;
  const otherOpen = Boolean(other && other.status === "active");
  if (!otherOpen) notFound();
  const name =
    (other?.subject_full_name ?? "").replace(/\s+/g, " ").trim() || displayFirstName(other?.subject_full_name ?? "Match");
  const cover = (photos ?? []).find((row) => row.is_primary) ?? photos?.[0];
  const photo = publicMediaUrl(cover?.storage_path);
  const online = !other?.hide_last_seen ? isOnlineNow(other?.last_seen_at) : false;
  const presence = !other?.hide_last_seen ? chatPresenceLine(online, other?.last_seen_at ?? null) : "";
  after(async () => {
    await supabase
      .from("notices")
      .update({ read_at: new Date().toISOString() })
      .eq("user_id", me.id)
      .eq("kind", "chat")
      .eq("href", `/app/chat/${id}`)
      .is("read_at", null);
  });
  return (
    <>
      <LiveRefresh table="messages" filter={`thread_id=eq.${id}`} />
      <ThreadView
        threadId={id}
        myProfileId={mine.id}
        peerName={name}
        peerPhoto={photo}
        peerHref={profileOpenHref(otherId, "chat")}
        presence={presence}
        online={online}
        needPlan={!thread.frozen && !chatLive}
        planLapsed={myAccess.lapsed}
        messages={[...(messages ?? [])].reverse().map((msg) => {
          const row = msg as typeof msg & { edited_at?: string | null; deleted_at?: string | null };
          return {
            id: String(row.id),
            sender_profile_id: row.sender_profile_id,
            body: row.body,
            created_at: row.created_at,
            read_at: row.read_at,
            edited_at: typeof row.edited_at === "string" ? row.edited_at : null,
            deleted_at: typeof row.deleted_at === "string" ? row.deleted_at : null,
          };
        })}
        canSend={!thread.frozen && chatLive}
        closedNote={
          thread.frozen ? (
            <p className="salon-closed">This chat is closed.</p>
          ) : !chatLive ? (
            <p className="salon-closed">
              A live plan is needed to keep chatting. <Link href="/app/plans">Open plans</Link>
            </p>
          ) : null
        }
      />
    </>
  );
}
