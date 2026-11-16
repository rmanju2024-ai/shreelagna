import Link from "next/link";
import { ChatAvatar } from "@/app/app/chat/chat-avatar";
import { InboxBoard } from "@/app/app/interests/inbox-board";
import { loadStaffInbox, loadStaffThread } from "@/lib/desk/member-inbox";
import { alertHeadline, loadStaffAlerts, loadStaffLikes } from "@/lib/desk/staff-inbox-extras";
import { chatBodyLine } from "@/lib/match/chat-ui";
import { alertWhen } from "@/lib/match/alert-copy";
import { SECTIONS, type SectionId } from "@/lib/match/likes-sections";
import { formatIstTime, parseInstant } from "@/lib/time/ist";
import { btnGhost } from "@/lib/ui/classes";

type ReviewTab = "chats" | "likes" | "alerts";

const alertStyle = (kind: string) => {
  if (kind === "interest_received") return { icon: "💌", tone: "interest" };
  if (kind === "interest_accepted") return { icon: "✨", tone: "accepted" };
  if (kind === "profile_view") return { icon: "👀", tone: "view" };
  if (kind === "shortlist") return { icon: "♥", tone: "shortlist" };
  if (kind === "contact_view") return { icon: "📇", tone: "contact" };
  if (kind === "match") return { icon: "💫", tone: "match" };
  return { icon: "🔔", tone: "general" };
};

function parseTab(raw?: string | null): ReviewTab {
  if (raw === "likes" || raw === "alerts") return raw;
  return "chats";
}

function parseSection(raw?: string | null): SectionId | undefined {
  return SECTIONS.some((row) => row.id === raw) ? (raw as SectionId) : undefined;
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
  const likeSection = parseSection(section);
  const hrefFor = (id: ReviewTab) => withParams(baseHref, { peek: "inbox", tab: id, thread: undefined, section: undefined });
  const [inbox, likes, alerts] = await Promise.all([
    loadStaffInbox(db, profileId),
    loadStaffLikes(db, profileId),
    loadStaffAlerts(db, ownerId, profileId),
  ]);
  const counts = {
    chats: inbox.threads.length,
    likes: likes.received.length + likes.sent.length,
    alerts: alerts.alerts.length,
  };

  return (
    <div className="desk-review">
      <p className="desk-review-note">Read only · this profile · the member is not notified</p>
      <nav className="desk-review-tabs" aria-label="Inbox preview">
        <TabLink href={hrefFor("chats")} on={active === "chats"} label="Chats" count={counts.chats} />
        <TabLink href={hrefFor("likes")} on={active === "likes"} label="Interests" count={counts.likes} />
        <TabLink href={hrefFor("alerts")} on={active === "alerts"} label="Alerts" count={counts.alerts} />
      </nav>

      {active === "chats" ? <ChatPane inbox={inbox} threadId={threadId} baseHref={baseHref} db={db} /> : null}

      {active === "likes" ? (
        <div className="desk-review-panel">
          <header className="desk-review-head">
            <div>
              <h3>{likeSection ? SECTIONS.find((row) => row.id === likeSection)?.label : "Interests"}</h3>
              <p>Interest in and interest out for this profile only.</p>
            </div>
            {likeSection ? (
              <Link href={hrefFor("likes")} className={btnGhost} scroll={false}>
                All sections
              </Link>
            ) : null}
          </header>
          <InboxBoard
            readOnly
            openFrom="desk"
            only={likeSection}
            viewAllHref={(id) => withParams(baseHref, { peek: "inbox", tab: "likes", section: id, thread: undefined })}
            received={likes.received}
            sent={likes.sent}
            accepted={likes.accepted}
            history={likes.history}
            viewed={likes.viewed}
            visited={likes.visited}
          />
        </div>
      ) : null}

      {active === "alerts" ? (
        <div className="desk-review-panel">
          <header className="desk-review-head">
            <div>
              <h3>Alerts</h3>
              <p>Views, interest notes and house messages. Read only.</p>
            </div>
          </header>
          <ul className="desk-review-alerts">
            {alerts.alerts.map((note) => {
              const { name, detail } = alertHeadline(note.kind, note.title ?? "", note.body ?? "");
              const style = alertStyle(note.kind);
              const href = note.match_profile_id ? `/browse/${note.match_profile_id}?from=desk` : null;
              const inner = (
                <>
                  <span className={`desk-review-icon is-${style.tone}`} aria-hidden>
                    {style.icon}
                  </span>
                  <ChatAvatar name={name} src={note.photo} />
                  <span className="desk-review-alert-copy">
                    <b>{name}</b>
                    <span>{detail || note.body || note.title || note.kind.replace(/_/g, " ")}</span>
                    {note.body && detail && note.body !== detail ? <small>{note.body}</small> : null}
                    <time dateTime={note.created_at}>{alertWhen(note.created_at)}</time>
                  </span>
                </>
              );
              return (
                <li key={note.id}>
                  {href ? (
                    <a href={href} className={`desk-review-alert${!note.read_at ? " is-new" : ""}`}>
                      {inner}
                    </a>
                  ) : (
                    <div className={`desk-review-alert${!note.read_at ? " is-new" : ""}`}>{inner}</div>
                  )}
                </li>
              );
            })}
          </ul>
          {!alerts.alerts.length ? <p className="desk-review-empty">No alerts on this profile.</p> : null}
        </div>
      ) : null}
    </div>
  );
}

function TabLink({ href, on, label, count }: { href: string; on: boolean; label: string; count: number }) {
  return (
    <Link href={href} className={on ? "is-on" : undefined} aria-current={on ? "page" : undefined} scroll={false}>
      {label}
      <b>{count}</b>
    </Link>
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
  const activeId = threadId && inbox.threads.some((row) => row.id === threadId) ? threadId : null;
  const open = activeId ? await loadStaffThread(db, activeId, inbox.myIds) : null;
  const listHref = withParams(baseHref, { peek: "inbox", tab: "chats", thread: undefined, section: undefined });
  return (
    <div className={`desk-review-chat${open ? " has-thread" : ""}`}>
      <aside className="desk-review-list" aria-label="Conversations">
        <header className="desk-review-head">
          <div>
            <h3>Chats</h3>
            <p>
              {inbox.threads.length} {inbox.threads.length === 1 ? "thread" : "threads"} · tap one to read
            </p>
          </div>
        </header>
        {inbox.threads.length ? (
          <ul>
            {inbox.threads.map((thread) => (
              <li key={thread.id}>
                <Link
                  href={withParams(baseHref, { peek: "inbox", tab: "chats", thread: thread.id, section: undefined })}
                  className={`desk-review-chat-row${thread.id === activeId ? " is-on" : ""}`}
                  replace
                  scroll={false}
                >
                  <ChatAvatar name={thread.name} src={thread.photo} />
                  <span>
                    <b>{thread.name}</b>
                    <small>{thread.preview || "No messages yet"}</small>
                  </span>
                  <time>{thread.stamp}</time>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="desk-review-empty">No chats on this profile.</p>
        )}
      </aside>
      <section className="desk-review-thread" aria-label="Conversation">
        {open ? (
          <>
            <header className="desk-review-thread-head">
              <Link href={listHref} className="desk-review-back" scroll={false}>
                Chats
              </Link>
              <ChatAvatar name={open.peerName} src={open.peerPhoto} size="sm" />
              <div>
                <h3>{open.peerName}</h3>
                <p>{open.frozen ? "Frozen · read only" : "Read only"}</p>
              </div>
            </header>
            <div className="desk-review-stream">
              <ul>
                {open.rows.map((row) => {
                  if (row.kind === "day") {
                    return (
                      <li key={row.key} className="desk-review-day">
                        {row.label}
                      </li>
                    );
                  }
                  if (row.kind === "unread") return null;
                  const msg = row.msg;
                  const gone = Boolean(msg.deleted_at);
                  const at = parseInstant(msg.created_at);
                  return (
                    <li key={msg.id} className={`desk-review-msg ${row.mine ? "is-mine" : "is-theirs"}`}>
                      <p>{chatBodyLine(msg.body, gone)}</p>
                      <time>{at ? formatIstTime(at) : ""}</time>
                    </li>
                  );
                })}
              </ul>
            </div>
          </>
        ) : (
          <div className="desk-review-pick">
            <h3>Pick a chat</h3>
            <p>Open a thread on the left. You can read every message. You cannot send, edit, or delete.</p>
          </div>
        )}
      </section>
    </div>
  );
}
