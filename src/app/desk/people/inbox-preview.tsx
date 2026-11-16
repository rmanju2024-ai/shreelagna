import Link from "next/link";
import { ChatAvatar } from "@/app/app/chat/chat-avatar";
import { ChatThreadList } from "@/app/app/chat/chat-thread-list";
import { ThreadView } from "@/app/app/chat/[id]/thread-view";
import { InboxBoard } from "@/app/app/interests/inbox-board";
import { InboxSwitcherNav, type InboxTab } from "@/components/inbox-switcher";
import { loadStaffInbox, loadStaffThread } from "@/lib/desk/member-inbox";
import { alertHeadline, loadStaffAlerts, loadStaffLikes } from "@/lib/desk/staff-inbox-extras";
import { alertWhen } from "@/lib/match/alert-copy";
import { type SectionId } from "@/lib/match/likes-sections";

function parseTab(raw?: string | null): InboxTab {
  if (raw === "likes" || raw === "alerts") return raw;
  return "chats";
}

function withParams(base: string, extra: Record<string, string | undefined>) {
  const q = new URLSearchParams(base.split("?")[1] ?? "");
  for (const [key, value] of Object.entries(extra)) {
    if (value) q.set(key, value);
    else q.delete(key);
  }
  const path = base.split("?")[0];
  return `${path}?${q.toString()}`;
}

const alertStyle = (kind: string) => {
  if (kind === "interest_received") return { icon: "💌", tone: "interest" };
  if (kind === "interest_accepted") return { icon: "✨", tone: "accepted" };
  if (kind === "profile_view") return { icon: "👀", tone: "view" };
  if (kind === "shortlist") return { icon: "♥", tone: "shortlist" };
  if (kind === "contact_view") return { icon: "📇", tone: "contact" };
  if (kind === "match") return { icon: "💫", tone: "match" };
  return { icon: "🔔", tone: "general" };
};

export async function StaffInboxPreview({
  db,
  profileId,
  ownerId,
  tab,
  threadId,
  section,
  baseHref,
}: {
  db: { from: (table: string) => any };
  profileId: string;
  ownerId: string;
  tab?: string | null;
  threadId?: string | null;
  section?: string | null;
  baseHref: string;
}) {
  const active = parseTab(tab);
  const hrefFor = (id: InboxTab) => withParams(baseHref, { peek: "inbox", tab: id, thread: undefined, section: undefined });
  const inspectHref = (profileId: string) =>
    profileId
      ? withParams(baseHref, {
          peek: "profile",
          view: profileId,
          tab: active,
          thread: threadId ?? undefined,
          section: section ?? undefined,
        })
      : baseHref;
  const emptyInbox = { myIds: [profileId], threads: [] as Awaited<ReturnType<typeof loadStaffInbox>>["threads"] };
  const emptyLikes = { received: [], sent: [], accepted: [], history: [], viewed: [], visited: [], pendingCount: 0 };
  const emptyAlerts = { alerts: [], unread: 0 };
  const [inbox, likes, alerts] = await Promise.all([
    loadStaffInbox(db, profileId).catch(() => emptyInbox),
    loadStaffLikes(db, profileId).catch(() => emptyLikes),
    loadStaffAlerts(db, ownerId, profileId).catch(() => emptyAlerts),
  ]);

  return (
    <div className="desk-review inbox-unified">
      <p className="desk-review-note">
        Staff popup · this member&apos;s inbox · not your profile · read only · nobody is notified
      </p>
      <InboxSwitcherNav
        active={active}
        hrefFor={hrefFor}
        counts={{ chatUnread: 0, likesPending: likes.pendingCount, alertUnread: 0 }}
      />

      {active === "chats" ? (
        <StaffChatPane inbox={inbox} threadId={threadId} baseHref={baseHref} db={db} inspectHref={inspectHref} />
      ) : null}

      {active === "likes" ? (
        <InboxBoard
          readOnly
          openFrom="desk"
          inspectHref={inspectHref}
          only={section as SectionId | undefined}
          viewAllHref={(id) => withParams(baseHref, { peek: "inbox", tab: "likes", section: id, thread: undefined })}
          received={likes.received}
          sent={likes.sent}
          accepted={likes.accepted}
          history={likes.history}
          viewed={likes.viewed}
          visited={likes.visited}
        />
      ) : null}

      {active === "alerts" ? (
        <div className="alerts-genz inbox-alerts">
          <ul className="alert-list alerts-genz-list">
            {alerts.alerts.map((note) => {
              const unread = !note.read_at;
              const { name, detail } = alertHeadline(note.kind, note.title ?? "", note.body ?? "");
              const style = alertStyle(note.kind);
              const fromHref = note.href?.startsWith("/browse/") ? note.href.split("/")[2]?.split("?")[0] : "";
              const otherId = note.match_profile_id || fromHref;
              const openHref = otherId ? inspectHref(otherId) : null;
              const inner = (
                <>
                  <span className={`alerts-genz-icon is-${style.tone}`} aria-hidden>
                    {style.icon}
                  </span>
                  <ChatAvatar name={name} src={note.photo} />
                  <span className="alert-copy">
                    <span className="alert-line">
                      <b>{name}</b> {detail || note.body || note.title}
                    </span>
                    <span className="alerts-genz-meta">
                      <time dateTime={note.created_at}>{alertWhen(note.created_at)}</time>
                      <span>Open →</span>
                    </span>
                  </span>
                  {unread ? <span className="alert-dot" aria-label="Unread for the member" /> : null}
                </>
              );
              return (
                <li key={note.id}>
                  {openHref ? (
                    <Link href={openHref} className={`alert-card${unread ? " is-new" : ""}`}>
                      {inner}
                    </Link>
                  ) : (
                    <div className={`alert-card${unread ? " is-new" : ""}`}>{inner}</div>
                  )}
                </li>
              );
            })}
          </ul>
          {!alerts.alerts.length ? (
            <div className="sx-empty alerts-genz-empty">
              <span aria-hidden>✨</span>
              <div>
                <h3>No alerts on this profile</h3>
                <p>When this member gets views or interest notes, they will show here. Opening them does not notify anyone.</p>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

async function StaffChatPane({
  db,
  inbox,
  threadId,
  baseHref,
  inspectHref,
}: {
  db: { from: (table: string) => any };
  inbox: Awaited<ReturnType<typeof loadStaffInbox>>;
  threadId?: string | null;
  baseHref: string;
  inspectHref: (profileId: string) => string;
}) {
  const activeId = threadId && inbox.threads.some((row) => row.id === threadId) ? threadId : null;
  const open = activeId ? await loadStaffThread(db, activeId, inbox.myIds).catch(() => null) : null;
  const listHref = withParams(baseHref, { peek: "inbox", tab: "chats", thread: undefined, section: undefined });
  const messages = open
    ? open.rows
        .filter((row): row is Extract<typeof row, { kind: "msg" }> => row.kind === "msg")
        .map((row) => row.msg)
    : [];

  return (
    <div className={`wc-shell desk-review-wc${open ? " has-thread" : ""}`}>
      <aside className="wc-side">
        {inbox.threads.length ? (
          <ChatThreadList
            threads={inbox.threads.map((thread) => ({
              id: thread.id,
              name: thread.name,
              photo: thread.photo,
              stamp: thread.stamp,
              preview: thread.preview,
              unread: "",
            }))}
            hrefFor={(id) => withParams(baseHref, { peek: "inbox", tab: "chats", thread: id, section: undefined })}
            activeId={activeId}
          />
        ) : (
          <p className="desk-review-empty">No chats on this profile.</p>
        )}
      </aside>
      {open && activeId ? (
        <ThreadView
          threadId={activeId}
          myProfileId={open.myProfileId}
          messages={messages}
          canSend={false}
          readOnly
          backHref={listHref}
          peerName={open.peerName}
          peerPhoto={open.peerPhoto}
          peerHref={
            inbox.threads.find((row) => row.id === activeId)?.otherId
              ? inspectHref(inbox.threads.find((row) => row.id === activeId)!.otherId)
              : undefined
          }
          presence={open.frozen ? "Frozen · read only" : "Read only · staff review"}
          online={false}
        />
      ) : (
        <section className="wc-welcome" aria-label="No chat selected">
          <div>
            <span className="gz-emoji" aria-hidden>
              💬
            </span>
            <h2>Their conversations</h2>
            <p>Pick a thread to read it as this member sees it. You cannot send, edit, or delete. Nobody is notified.</p>
          </div>
        </section>
      )}
    </div>
  );
}
