import Link from "next/link";
import { ChatAvatar } from "@/app/app/chat/chat-avatar";
import { InboxBoard } from "@/app/app/interests/inbox-board";
import { InboxSwitcherNav, type InboxTab } from "@/components/inbox-switcher";
import { loadStaffInbox, loadStaffThread } from "@/lib/desk/member-inbox";
import { alertHeadline, loadStaffAlerts, loadStaffLikes } from "@/lib/desk/staff-inbox-extras";
import { chatBodyLine } from "@/lib/match/chat-ui";
import { alertWhen } from "@/lib/match/alert-copy";
import { formatIstTime, parseInstant } from "@/lib/time/ist";

const alertStyle = (kind: string) => {
  if (kind === "interest_received") return { icon: "💌", tone: "interest" };
  if (kind === "interest_accepted") return { icon: "✨", tone: "accepted" };
  if (kind === "profile_view") return { icon: "👀", tone: "view" };
  if (kind === "shortlist") return { icon: "♥", tone: "shortlist" };
  if (kind === "contact_view") return { icon: "📇", tone: "contact" };
  if (kind === "match") return { icon: "💫", tone: "match" };
  return { icon: "🔔", tone: "general" };
};

function parseTab(raw?: string | null): InboxTab {
  if (raw === "likes" || raw === "alerts") return raw;
  return "chats";
}

function withParams(base: string, extra: Record<string, string>) {
  const q = new URLSearchParams(base.split("?")[1] ?? "");
  for (const [key, value] of Object.entries(extra)) q.set(key, value);
  const path = base.split("?")[0];
  return `${path}?${q.toString()}`;
}

export async function StaffInboxPreview({
  db,
  profileId,
  ownerId,
  tab,
  threadId,
  baseHref,
}: {
  db: { from: (table: string) => any };
  profileId: string;
  ownerId: string;
  tab?: string | null;
  threadId?: string | null;
  baseHref: string;
}) {
  const active = parseTab(tab);
  const inboxHref = (id: InboxTab) => withParams(baseHref, { peek: "inbox", tab: id });
  const [inbox, likes, alerts] = await Promise.all([
    loadStaffInbox(db, profileId),
    loadStaffLikes(db, ownerId),
    loadStaffAlerts(db, ownerId),
  ]);
  const counts = {
    chatUnread: inbox.threads.length,
    likesPending: likes.pendingCount,
    alertUnread: alerts.unread,
  };

  return (
    <div className="desk-inbox-full">
      <InboxSwitcherNav active={active} counts={counts} hrefFor={inboxHref} />
      {active === "chats" ? (
        <ChatPane inbox={inbox} threadId={threadId} baseHref={baseHref} db={db} />
      ) : null}
      {active === "likes" ? (
        <div className="desk-inbox-preview is-stack">
          <header className="wc-side-head">
            <h1>Interests</h1>
            <p>Read only · member is not notified</p>
          </header>
          <div className="desk-inbox-pane">
            <InboxBoard
              readOnly
              received={likes.received}
              sent={likes.sent}
              accepted={likes.accepted}
              history={likes.history}
              viewed={likes.viewed}
              visited={likes.visited}
            />
          </div>
        </div>
      ) : null}
      {active === "alerts" ? (
        <section className="desk-inbox-preview is-stack" aria-label="Member alerts">
          <header className="wc-side-head">
            <h1>Alerts</h1>
            <p>Member inbox · view only</p>
          </header>
          <div className="desk-inbox-pane alerts-genz inbox-alerts">
            <ul className="alert-list alerts-genz-list">
              {alerts.alerts.map((note) => {
                const unread = !note.read_at;
                const { name, detail } = alertHeadline(note.kind, note.title ?? "", note.body ?? "");
                const style = alertStyle(note.kind);
                return (
                  <li key={note.id}>
                    <div className={`alert-card${unread ? " is-new" : ""}`}>
                      <span className={`alerts-genz-icon is-${style.tone}`} aria-hidden>
                        {style.icon}
                      </span>
                      <ChatAvatar name={name} src={note.photo} />
                      <span className="alert-copy">
                        <span className="alert-line">
                          <b>{name}</b> {detail}
                        </span>
                        <span className="alerts-genz-meta">
                          <time dateTime={note.created_at}>{alertWhen(note.created_at)}</time>
                        </span>
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
            {!alerts.alerts.length ? (
              <div className="sx-empty alerts-genz-empty">
                <span aria-hidden>✨</span>
                <div>
                  <h2>No alerts on this account</h2>
                  <p>Matches, views and interest notes will list here.</p>
                </div>
              </div>
            ) : null}
          </div>
        </section>
      ) : null}
    </div>
  );
}

async function ChatPane({
  db,
  inbox,
  threadId,
  baseHref,
}: {
  db: { from: (table: string) => any };
  inbox: Awaited<ReturnType<typeof loadStaffInbox>>;
  threadId?: string | null;
  baseHref: string;
}) {
  const activeId = threadId && inbox.threads.some((row) => row.id === threadId) ? threadId : inbox.threads[0]?.id;
  const open = activeId ? await loadStaffThread(db, activeId, inbox.myIds) : null;
  return (
    <div className={`desk-inbox-preview wc-shell${open ? " has-thread" : ""}`}>
      <aside className="wc-side" aria-label="Member conversations">
        <header className="wc-side-head">
          <h1>Chats</h1>
          <p>
            {inbox.threads.length} {inbox.threads.length === 1 ? "match" : "matches"}
          </p>
        </header>
        {inbox.threads.length ? (
          <ul className="wc-list">
            {inbox.threads.map((thread) => (
              <li key={thread.id}>
                <Link
                  href={withParams(baseHref, { peek: "inbox", tab: "chats", thread: thread.id })}
                  className={`wa-row${thread.id === activeId ? " is-active" : ""}`}
                  replace
                  scroll={false}
                >
                  <ChatAvatar name={thread.name} src={thread.photo} />
                  <span className="wa-row-main">
                    <span className="wa-row-top">
                      <b>{thread.name}</b>
                      <span className="wa-row-meta">
                        <time>{thread.stamp}</time>
                      </span>
                    </span>
                    <span className="wc-row-bottom">
                      <span className="wa-preview">{thread.preview}</span>
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="wa-empty">No chats on this account yet.</p>
        )}
      </aside>
      <section className="salon-sheet desk-inbox-thread" aria-label="Conversation">
        {open ? (
          <>
            <header className="salon-head">
              <ChatAvatar name={open.peerName} src={open.peerPhoto} size="sm" />
              <div>
                <h3>{open.peerName}</h3>
                <p>{open.frozen ? "Frozen · read only" : "Read only · member is not notified"}</p>
              </div>
            </header>
            <div className="salon-stage wa-stage">
              <ul className="salon-stream">
                {open.rows.map((row) => {
                  if (row.kind === "day") {
                    return (
                      <li key={row.key} className="salon-day">
                        {row.label}
                      </li>
                    );
                  }
                  if (row.kind === "unread") return null;
                  const msg = row.msg;
                  const gone = Boolean(msg.deleted_at);
                  const at = parseInstant(msg.created_at);
                  return (
                    <li
                      key={msg.id}
                      className={`salon-row ${row.mine ? "is-mine" : "is-theirs"}${row.tight ? " is-tight" : ""}${gone ? " is-deleted" : ""}`}
                    >
                      <div className="salon-slip">
                        <p>{chatBodyLine(msg.body, gone)}</p>
                        <time>{at ? formatIstTime(at) : ""}</time>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </>
        ) : (
          <div className="wc-welcome">
            <div>
              <h3>Inbox preview</h3>
              <p>Pick a conversation. You can read it. Nothing is sent, and the member is not alerted.</p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
