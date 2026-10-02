"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type MouseEvent, type ReactNode } from "react";
import { respondInterest } from "@/app/app/match/actions";
import { pageCount, pageItems, PROFILE_PAGE_SIZE } from "@/lib/match/inbox-card";
import { btnGhost, btnPrimary } from "@/lib/ui/classes";

function profileHref(note: { href?: string; profileId?: string }): string | undefined {
  if (note.href) return note.href;
  if (note.profileId) return `/browse/${note.profileId}`;
  return undefined;
}

export type InboxNote = {
  id: string;
  name: string;
  when: string;
  whenLabel?: string;
  profileId?: string;
  href?: string;
  status?: string;
  photoUrl?: string | null;
  lastOnline?: string | null;
  age?: string | null;
  height?: string | null;
  religion?: string | null;
  community?: string | null;
  city?: string | null;
  state?: string | null;
  education?: string | null;
  occupation?: string | null;
  reason?: string | null;
};

export type InboxView = InboxNote;

const TABS = [
  { id: "received", label: "Received", short: "In" },
  { id: "sent", label: "Sent", short: "Sent" },
  { id: "accepted", label: "Accepted", short: "Yes" },
  { id: "history", label: "History", short: "Past" },
  { id: "viewed", label: "Who viewed you", short: "Them" },
  { id: "visited", label: "You viewed", short: "You" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function InboxBoard({
  received,
  sent,
  accepted,
  history,
  viewed = [],
  visited = [],
}: {
  received: InboxNote[];
  sent: InboxNote[];
  accepted: InboxNote[];
  history: InboxNote[];
  viewed?: InboxView[];
  visited?: InboxView[];
}) {
  const [tab, setTab] = useState<TabId>("received");
  const counts: Record<TabId, number> = {
    received: received.length,
    sent: sent.length,
    accepted: accepted.length,
    history: history.length,
    viewed: viewed.length,
    visited: visited.length,
  };

  return (
    <article className={`inbox-board inbox-theme-${tab}`}>
      <aside className="inbox-rail" aria-label="Inbox sections">
        <div className="inbox-tabs" role="tablist">
          {TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={tab === item.id}
              className={`inbox-tab inbox-tab-${item.id}${tab === item.id ? " is-on" : ""}`}
              onClick={() => setTab(item.id)}
            >
              <span className="inbox-tab-full">{item.label}</span>
              <span className="inbox-tab-short">{item.short}</span>
              <b>{counts[item.id]}</b>
            </button>
          ))}
        </div>
      </aside>
      <div className="inbox-pane">
        {tab === "received" ? (
          <NoteList
            empty="None pending."
            notes={received}
            actions={(note) => (
              <>
                <form action={respondInterest}>
                  <input type="hidden" name="interest_id" value={note.id} />
                  <input type="hidden" name="decision" value="accepted" />
                  <button type="submit" className={btnPrimary}>
                    Accept
                  </button>
                </form>
                <DeclineForm interestId={note.id} />
              </>
            )}
          />
        ) : null}
        {tab === "sent" ? <NoteList empty="None pending." notes={sent} /> : null}
        {tab === "accepted" ? (
          <NoteList
            empty="None yet."
            notes={accepted}
            actions={() => (
              <Link href="/app/chat" className={`${btnPrimary} inbox-chat-btn`}>
                Open chat
              </Link>
            )}
          />
        ) : null}
        {tab === "history" ? (
          <NoteList empty="No expired, declined, or deleted notes." notes={history} />
        ) : null}
        {tab === "viewed" ? <NoteList empty="No one has viewed you yet." notes={viewed} /> : null}
        {tab === "visited" ? <NoteList empty="You have not viewed anyone yet." notes={visited} /> : null}
      </div>
    </article>
  );
}

function OpenLink({
  href,
  className,
  children,
  kind,
}: {
  href: string;
  className: string;
  children: ReactNode;
  kind: "photo" | "name";
}) {
  const [hot, setHot] = useState(false);
  const style =
    kind === "name"
      ? {
          cursor: "pointer" as const,
          color: hot ? "#6f1d1b" : "#1a100c",
          textDecorationLine: hot ? "underline" : "none",
          textUnderlineOffset: "0.2em",
          textDecorationThickness: "2px",
        }
      : {
          cursor: "pointer" as const,
          boxShadow: hot ? "0 0 0 3px #b8894c, 0 8px 16px rgba(111, 29, 27, 0.2)" : undefined,
          borderColor: hot ? "#b8894c" : undefined,
          filter: hot ? "brightness(1.05)" : undefined,
        };
  return (
    <a
      href={href}
      className={className}
      style={style}
      onMouseEnter={() => setHot(true)}
      onMouseLeave={() => setHot(false)}
    >
      {children}
    </a>
  );
}

function DeclineForm({ interestId }: { interestId: string }) {
  const [open, setOpen] = useState(false);
  if (!open) {
    return (
      <button type="button" className={btnGhost} onClick={() => setOpen(true)}>
        Decline
      </button>
    );
  }
  return (
    <form action={respondInterest} className="inbox-decline">
      <input type="hidden" name="interest_id" value={interestId} />
      <input type="hidden" name="decision" value="declined" />
      <textarea name="reason" maxLength={280} rows={2} placeholder="Optional reason for them" />
      <div className="inbox-decline-actions">
        <button type="submit" className={btnGhost}>
          Confirm decline
        </button>
        <button type="button" className={btnGhost} onClick={() => setOpen(false)}>
          Cancel
        </button>
      </div>
    </form>
  );
}

function cardChips(note: InboxNote): string[] {
  return [
    [note.age, note.height].filter(Boolean).join(" · "),
    [note.religion, note.community].filter(Boolean).join(" · "),
    [note.city, note.state].filter(Boolean).join(", "),
    note.education ?? "",
    note.occupation ?? "",
  ].filter(Boolean);
}

function CardFace({ note, actions }: { note: InboxNote; actions?: ReactNode }) {
  const href = profileHref(note);
  const photo = note.photoUrl ? (
    <Image src={note.photoUrl} alt="" fill sizes="(max-width: 640px) 40vw, 200px" quality={65} style={{ objectFit: "cover" }} />
  ) : (
    <span>{note.name.slice(0, 1)}</span>
  );
  const chips = cardChips(note);
  return (
    <div className="browse-card-link inbox-card-face">
      {href ? (
        <OpenLink href={href} className="browse-card-photo inbox-photo inbox-open" kind="photo">
          {photo}
        </OpenLink>
      ) : (
        <div className="browse-card-photo inbox-photo" aria-hidden={!note.photoUrl}>
          {photo}
        </div>
      )}
      <div className="browse-card-copy inbox-body">
        {href ? (
          <OpenLink href={href} className="browse-card-name inbox-name inbox-open" kind="name">
            {note.name}
          </OpenLink>
        ) : (
          <p className="browse-card-name inbox-name">{note.name}</p>
        )}
        {note.lastOnline ? <p className="browse-card-seen inbox-online">{note.lastOnline}</p> : null}
        {chips.length ? (
          <ul className="browse-card-meta inbox-meta">
            {chips.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        ) : null}
        {note.status ? <p className="inbox-status">{note.status}</p> : null}
        {note.reason ? <p className="inbox-reason">{note.reason}</p> : null}
      </div>
      <div className="inbox-side">
        {note.when ? (
          <p className="inbox-when">
            {note.whenLabel ? `${note.whenLabel} · ` : ""}
            {note.when}
          </p>
        ) : null}
        {actions ? <div className="inbox-actions">{actions}</div> : null}
      </div>
    </div>
  );
}

function NoteList({
  notes,
  empty,
  actions,
}: {
  notes: InboxNote[];
  empty: string;
  actions?: (note: InboxNote) => ReactNode;
}) {
  const router = useRouter();
  const [page, setPage] = useState(1);
  if (!notes.length) return <p className="inbox-empty">{empty}</p>;
  const pages = pageCount(notes.length);
  const current = Math.min(page, pages);
  const shown = pageItems(notes, current);

  function openProfile(event: MouseEvent, href?: string) {
    if (!href) return;
    const target = event.target as HTMLElement;
    if (target.closest(".inbox-actions, a.inbox-open")) return;
    router.push(href);
  }

  return (
    <div>
      <ul className="inbox-list">
        {shown.map((note) => {
          const href = profileHref(note);
          return (
          <li
            key={note.id}
            className={`browse-card inbox-card inbox-profile${href ? " is-openable" : ""}`}
            onClick={(event) => openProfile(event, href)}
          >
            <CardFace note={note} actions={actions ? actions(note) : null} />
          </li>
          );
        })}
      </ul>
      {pages > 1 ? (
        <nav className="inbox-pager" aria-label="Profile pages">
          <button type="button" className={btnGhost} disabled={current <= 1} onClick={() => setPage(current - 1)}>
            Previous
          </button>
          <p>
            Page {current} of {pages}
            <span className="inbox-pager-size"> · {PROFILE_PAGE_SIZE} per page</span>
          </p>
          <button type="button" className={btnGhost} disabled={current >= pages} onClick={() => setPage(current + 1)}>
            Next
          </button>
        </nav>
      ) : null}
    </div>
  );
}
