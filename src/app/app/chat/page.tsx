import Link from "next/link";
import { ChatAvatar } from "@/app/app/chat/chat-avatar";
import { PageShell } from "@/components/site-chrome";
import { ensureAppUser, getAuth } from "@/lib/auth/session";
import { chatStamp, countByKey, latestByThread, previewText, unreadLabel } from "@/lib/match/chat-ui";
import { pickPrimaryPhotoMap, publicMediaUrl } from "@/lib/match/inbox-card";
import { hasAcceptedInterest } from "@/lib/match/interest-status";
import { displayFirstName } from "@/lib/profile/options";
import { createServiceClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function ChatListPage() {
  const { supabase, user } = await getAuth();
  if (!supabase || !user) redirect("/login?next=/app/chat");
  const me = await ensureAppUser(supabase, user);
  if (!me) redirect("/login?error=account");

  const { data: mine } = await supabase.from("profiles").select("id").eq("created_by", me.id);
  const ids = (mine ?? []).map((p) => p.id);
  const { data: threads } = ids.length
    ? await supabase
        .from("threads")
        .select("id, profile_a, profile_b, created_at")
        .or(`profile_a.in.(${ids.join(",")}),profile_b.in.(${ids.join(",")})`)
        .order("created_at", { ascending: false })
    : { data: [] };

  const { data: acceptedRows } = ids.length
    ? await supabase
        .from("interests")
        .select("from_profile_id, to_profile_id, status, created_at")
        .eq("status", "accepted")
        .or(`from_profile_id.in.(${ids.join(",")}),to_profile_id.in.(${ids.join(",")})`)
    : { data: [] };
  const openThreads = (threads ?? []).filter((thread) =>
    hasAcceptedInterest(acceptedRows ?? [], thread.profile_a, thread.profile_b),
  );
  const otherIds = [...new Set(openThreads.map((t) => (ids.includes(t.profile_a) ? t.profile_b : t.profile_a)))];
  const { data: names } = otherIds.length
    ? await supabase.from("profiles").select("id, subject_full_name, status").in("id", otherIds)
    : { data: [] };
  const nameMap = new Map((names ?? []).map((n) => [n.id, n]));

  const threadIds = openThreads.map((t) => t.id);
  const { data: msgs } = threadIds.length
    ? await supabase.from("messages").select("thread_id, body, created_at").in("thread_id", threadIds).order("created_at", { ascending: false })
    : { data: [] };
  const lastMap = latestByThread(msgs ?? []);
  const { data: unreadNotes } = await supabase
    .from("notices")
    .select("href")
    .eq("user_id", me.id)
    .eq("kind", "chat")
    .is("read_at", null);
  const unreadMap = countByKey((unreadNotes ?? []).map((row) => row.href));

  const media = createServiceClient() ?? supabase;
  let photoMap = new Map<string, string>();
  if (otherIds.length) {
    const first = await media
      .from("media")
      .select("profile_id, storage_path, created_at, is_primary")
      .eq("kind", "photo")
      .in("profile_id", otherIds)
      .order("created_at");
    const photos = first.error
      ? (await media.from("media").select("profile_id, storage_path").eq("kind", "photo").in("profile_id", otherIds)).data ?? []
      : first.data ?? [];
    photoMap = pickPrimaryPhotoMap(photos);
  }

  return (
    <PageShell>
      <article className="wa-app">
        <header className="wa-head">
          <div>
            <h1>Chats</h1>
            <p>Accepted matches</p>
          </div>
        </header>
        {openThreads.length ? (
          <ul className="wa-list">
            {openThreads.map((thread) => {
              const other = ids.includes(thread.profile_a) ? thread.profile_b : thread.profile_a;
              const row = nameMap.get(other);
              const open = row?.status === "active";
              const name = displayFirstName(row?.subject_full_name ?? (open ? "Match" : "Unavailable"));
              const last = lastMap.get(thread.id);
              const unread = unreadLabel(unreadMap.get(`/app/chat/${thread.id}`) ?? 0);
              const inner = (
                <>
                  <ChatAvatar name={name} src={open ? publicMediaUrl(photoMap.get(other)) : null} />
                  <span className="wa-row-main">
                    <span className="wa-row-top">
                      <b>{name}</b>
                      <span className="wa-row-meta">
                        <time>{chatStamp(last?.created_at || thread.created_at)}</time>
                        {unread ? <span className="wa-unread">{unread}</span> : null}
                      </span>
                    </span>
                    <span className={`wa-preview${unread ? " is-new" : ""}`}>{open ? previewText(last?.body) : "Hidden or deleted. Chat closed."}</span>
                  </span>
                </>
              );
              return (
                <li key={thread.id}>
                  {open ? (
                    <Link href={`/app/chat/${thread.id}`} className="wa-row">
                      {inner}
                    </Link>
                  ) : (
                    <div className="wa-row is-closed">{inner}</div>
                  )}
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="wa-empty">No accepted chats yet.</p>
        )}
      </article>
    </PageShell>
  );
}
