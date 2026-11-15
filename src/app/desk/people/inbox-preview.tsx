import Link from "next/link";
import { ChatAvatar } from "@/app/app/chat/chat-avatar";
import { loadStaffInbox, loadStaffThread } from "@/lib/desk/member-inbox";
import { chatBodyLine } from "@/lib/match/chat-ui";
import { formatIstTime, parseInstant } from "@/lib/time/ist";

export async function StaffInboxPreview({
  db,
  profileId,
  threadId,
  baseHref,
}: {
  db: { from: (table: string) => any };
  profileId: string;
  threadId?: string | null;
  baseHref: string;
}) {
  const inbox = await loadStaffInbox(db, profileId);
  const activeId = threadId && inbox.threads.some((row) => row.id === threadId) ? threadId : inbox.threads[0]?.id;
  const open = activeId ? await loadStaffThread(db, activeId, inbox.myIds) : null;

  return (
    <div className="desk-inbox-preview wc-shell">
      <aside className="wc-side" aria-label="Member conversations">
        <header className="wc-side-head">
          <h3>Chats</h3>
          <p>
            {inbox.threads.length} {inbox.threads.length === 1 ? "match" : "matches"}
          </p>
        </header>
        {inbox.threads.length ? (
          <ul className="wc-list">
            {inbox.threads.map((thread) => (
              <li key={thread.id}>
                <Link
                  href={`${baseHref}?peek=inbox&thread=${thread.id}`}
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
