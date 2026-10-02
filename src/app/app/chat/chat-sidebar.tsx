import Link from "next/link";
import { redirect } from "next/navigation";
import { ChatAvatar } from "@/app/app/chat/chat-avatar";
import { ensureAppUser, getAuth } from "@/lib/auth/session";
import { chatStamp, countByKey, latestByThread, previewText, unreadLabel } from "@/lib/match/chat-ui";
import { pickPrimaryPhotoMap, publicMediaUrl } from "@/lib/match/inbox-card";
import { pairCanChat } from "@/lib/match/interest-status";
import { displayFirstName } from "@/lib/profile/options";
import { createServiceClient } from "@/lib/supabase/server";

/** Left column of the chat screen: every accepted conversation, newest first. */
export async function ChatSidebar({ activeId }: { activeId?: string }) {
  const { supabase, user } = await getAuth();
  if (!supabase || !user) redirect("/login?next=/app/chat");
  const me = await ensureAppUser(supabase, user);
  if (!me) redirect("/login?error=account");

  const { data: mine } = await supabase.from("profiles").select("id").eq("created_by", me.id);
  const ids = (mine ?? []).map((p) => p.id);
  const [{ data: threads }, { data: chatRows }, { data: unreadNotes }] = await Promise.all([
    ids.length
      ? supabase
          .from("threads")
          .select("id, profile_a, profile_b, created_at")
          .or(`profile_a.in.(${ids.join(",")}),profile_b.in.(${ids.join(",")})`)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [] as { id: string; profile_a: string; profile_b: string; created_at: string }[] }),
    ids.length
      ? supabase
          .from("interests")
          .select("from_profile_id, to_profile_id, status, created_at")
          .or(`from_profile_id.in.(${ids.join(",")}),to_profile_id.in.(${ids.join(",")})`)
      : Promise.resolve({ data: [] as { from_profile_id: string; to_profile_id: string; status: string; created_at: string }[] }),
    supabase.from("notices").select("href").eq("user_id", me.id).eq("kind", "chat").is("read_at", null),
  ]);
  const openThreads = (threads ?? []).filter((thread) => pairCanChat(chatRows ?? [], thread.profile_a, thread.profile_b));
  const otherIds = [...new Set(openThreads.map((t) => (ids.includes(t.profile_a) ? t.profile_b : t.profile_a)))];
  const threadIds = openThreads.map((t) => t.id);
  const media = createServiceClient() ?? supabase;

  const [{ data: names }, { data: msgs }, photoRows] = await Promise.all([
    otherIds.length
      ? supabase.from("profiles").select("id, subject_full_name, status").in("id", otherIds)
      : Promise.resolve({ data: [] as { id: string; subject_full_name: string | null; status: string }[] }),
    threadIds.length
      ? supabase
          .from("messages")
          .select("thread_id, body, created_at")
          .in("thread_id", threadIds)
          .order("created_at", { ascending: false })
          .limit(300)
      : Promise.resolve({ data: [] as { thread_id: string; body: string; created_at: string }[] }),
    otherIds.length
      ? media
          .from("media")
          .select("profile_id, storage_path, created_at, is_primary")
          .eq("kind", "photo")
          .in("profile_id", otherIds)
          .order("created_at")
          .then((first) =>
            first.error
              ? media.from("media").select("profile_id, storage_path").eq("kind", "photo").in("profile_id", otherIds).then((r) => r.data ?? [])
              : (first.data ?? []),
          )
      : Promise.resolve([]),
  ]);
  const nameMap = new Map((names ?? []).map((n) => [n.id, n]));
  const lastMap = latestByThread(msgs ?? []);
  const unreadMap = countByKey((unreadNotes ?? []).map((row) => row.href));
  const photoMap = pickPrimaryPhotoMap(photoRows as never);

  return (
    <aside className="wc-side" aria-label="Conversations">
      <header className="wc-side-head">
        <h1>Chats</h1>
        <p>{openThreads.length} {openThreads.length === 1 ? "match" : "matches"}</p>
      </header>
      {openThreads.length ? (
        <ul className="wc-list">
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
                    </span>
                  </span>
                  <span className="wc-row-bottom">
                    <span className={`wa-preview${unread ? " is-new" : ""}`}>
                      {open ? previewText(last?.body) : "Hidden or deleted. Chat closed."}
                    </span>
                    {unread ? <span className="wa-unread">{unread}</span> : null}
                  </span>
                </span>
              </>
            );
            return (
              <li key={thread.id}>
                {open ? (
                  <Link
                    href={`/app/chat/${thread.id}`}
                    className={`wa-row${thread.id === activeId ? " is-active" : ""}`}
                    aria-current={thread.id === activeId ? "page" : undefined}
                  >
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
    </aside>
  );
}

export function ChatSidebarSkeleton() {
  return (
    <aside className="wc-side" aria-busy="true">
      <header className="wc-side-head">
        <h1>Chats</h1>
      </header>
      <div className="wc-skel">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="sx-skel" />
        ))}
      </div>
    </aside>
  );
}
