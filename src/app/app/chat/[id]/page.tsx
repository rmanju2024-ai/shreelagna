import Link from "next/link";
import { LiveRefresh } from "@/components/live-refresh";
import { after } from "next/server";
import { ThreadView } from "@/app/app/chat/[id]/thread-view";
import { ChatAvatar } from "@/app/app/chat/chat-avatar";
import { PageShell } from "@/components/site-chrome";
import { ensureAppUser, getAuth } from "@/lib/auth/session";
import { publicMediaUrl } from "@/lib/match/inbox-card";
import { lastOnlineLine } from "@/lib/profile/last-seen";
import { pairCanChat } from "@/lib/match/interest-status";
import { pairPlanLive } from "@/lib/membership/access";
import { loadMembership, loadMembershipForProfile } from "@/lib/membership/load";
import { displayFirstName } from "@/lib/profile/options";
import { createServiceClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";

export default async function ChatThreadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, user } = await getAuth();
  if (!supabase || !user) redirect(`/login?next=/app/chat/${id}`);
  const me = await ensureAppUser(supabase, user);
  if (!me) redirect("/login?error=account");

  const { data: thread } = await supabase
    .from("threads")
    .select("id, profile_a, profile_b, frozen")
    .eq("id", id)
    .maybeSingle();
  if (!thread) notFound();

  const { data: mine } = await supabase
    .from("profiles")
    .select("id, status")
    .eq("created_by", me.id)
    .in("id", [thread.profile_a, thread.profile_b])
    .maybeSingle();
  if (!mine || mine.status !== "active") notFound();

  const otherId = mine.id === thread.profile_a ? thread.profile_b : thread.profile_a;
  const db = createServiceClient() ?? supabase;
  const [{ data: interestRows }, myAccess, otherAccess, { data: other }, { data: messages }, { data: photos }] =
    await Promise.all([
    supabase
      .from("interests")
      .select("from_profile_id, to_profile_id, status, created_at")
      .or(
        `and(from_profile_id.eq.${mine.id},to_profile_id.eq.${otherId}),and(from_profile_id.eq.${otherId},to_profile_id.eq.${mine.id})`,
      )
      .limit(8),
    loadMembership(db, me),
    loadMembershipForProfile(db, otherId),
    supabase
      .from("profiles")
      .select("id, subject_full_name, status, last_seen_at, hide_last_seen")
      .eq("id", otherId)
      .maybeSingle(),
    supabase.from("messages").select("id, sender_profile_id, body, created_at").eq("thread_id", id).order("created_at"),
    db.from("media").select("storage_path, is_primary").eq("profile_id", otherId).eq("kind", "photo").order("created_at"),
  ]);
  if (!pairCanChat(interestRows ?? [], mine.id, otherId)) notFound();
  const chatLive = pairPlanLive(myAccess.live, otherAccess.live);
  const otherOpen = Boolean(other && other.status === "active");
  const name = otherOpen ? displayFirstName(other?.subject_full_name ?? "Match") : "Profile unavailable";
  const cover = (photos ?? []).find((row) => row.is_primary) ?? photos?.[0];
  const photo = otherOpen ? publicMediaUrl(cover?.storage_path) : null;
  const seen = otherOpen && !other?.hide_last_seen ? lastOnlineLine(other?.last_seen_at) : null;
  after(async () => {
    await supabase
      .from("notices")
      .update({ read_at: new Date().toISOString() })
      .eq("user_id", me.id)
      .eq("kind", "chat")
      .eq("href", `/app/chat/${id}`)
      .is("read_at", null);
  });
  const person = (
    <>
      <ChatAvatar name={name} src={photo} size="sm" />
      <div>
        <h1>{name}</h1>
        <p>{otherOpen ? seen || "Tap to view profile" : "This chat is closed"}</p>
      </div>
    </>
  );

  return (
    <PageShell>
      <LiveRefresh table="messages" filter={`thread_id=eq.${id}`} />
      <article className="wa-app">
        <header className="wa-head">
          <Link href="/app/chat" className="wa-back" aria-label="All chats">
            ‹
          </Link>
          {otherOpen ? (
            <Link href={`/browse/${otherId}`} className="wa-head-person">
              {person}
            </Link>
          ) : (
            <div className="wa-head-person">{person}</div>
          )}
        </header>
        <ThreadView
          threadId={id}
          myProfileId={mine.id}
          messages={(messages ?? []).map((msg) => ({
            id: msg.id,
            sender_profile_id: msg.sender_profile_id,
            body: msg.body,
            created_at: msg.created_at,
          }))}
          canSend={!thread.frozen && otherOpen && chatLive}
        />
        {thread.frozen || !otherOpen ? (
          <p className="wa-closed">This chat is closed.</p>
        ) : !chatLive ? (
          <p className="wa-closed">
            A live plan is needed to keep chatting. <Link href="/app/plans">Open plans</Link>
          </p>
        ) : null}
      </article>
    </PageShell>
  );
}