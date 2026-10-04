"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, type MouseEvent, type ReactNode } from "react";
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

const SECTIONS = [
  { id: "received", label: "Received", meaning: "Families who showed interest in you", empty: "No pending interests right now" },
  { id: "sent", label: "Sent", meaning: "Interests you have sent, awaiting a reply", empty: "No pending interests sent" },
  { id: "accepted", label: "Accepted", meaning: "Mutual interest, ready to talk", empty: "No accepted interests yet" },
  { id: "viewed", label: "Who viewed you", meaning: "Recent visitors to your profile", empty: "No one has viewed you yet" },
  { id: "visited", label: "You viewed", meaning: "Profiles you recently opened", empty: "You have not viewed anyone yet" },
  { id: "history", label: "History", meaning: "Expired, declined or closed", empty: "No expired, declined, or deleted notes." },
] as const;

type SectionId = (typeof SECTIONS)[number]["id"];
export const LIKES_PREVIEW_LIMIT = 5;

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
  const notes: Record<SectionId, InboxNote[]> = { received, sent, accepted, history, viewed, visited };
  const actions: Partial<Record<SectionId, (note: InboxNote) => ReactNode>> = {
    received: (note) => (
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
    ),
    accepted: () => (
      <Link href="/app/chat" className={`${btnPrimary} inbox-chat-btn`}>
        Open chat
      </Link>
    ),
  };

  return (
    <article className="sx-feed inbox-modern">
      {SECTIONS.map((section) => (
        <LikesSection key={section.id} section={section} notes={notes[section.id]} actions={actions[section.id]} />
      ))}
    </article>
  );
}

function LikesSection({
  section,
  notes,
  actions,
}: {
  section: (typeof SECTIONS)[number];
  notes: InboxNote[];
  actions?: (note: InboxNote) => ReactNode;
}) {
  const scroller = useRef<HTMLUListElement>(null);
  const [expanded, setExpanded] = useState(false);
  const count = notes.length;
  const id = `likes-${section.id}`;
  return (
    <section className="sx-feed-row" aria-labelledby={id}>
      <header className="sx-feed-head">
        <div className="sx-3d-banner">
          <span className="sx-star is-a" aria-hidden>✦</span>
          <span className="sx-star is-b" aria-hidden>✧</span>
          <span className="sx-star is-c" aria-hidden>✦</span>
          <div className="sx-3d-copy">
            <h2 id={id}>{section.label}</h2>
            <p>{section.meaning}</p>
          </div>
          <small>{count} {count === 1 ? "profile" : "profiles"}</small>
        </div>
      </header>
      {!count ? (
        <div className="sx-empty is-compact">
          <h3>{section.empty}</h3>
        </div>
      ) : expanded ? (
        <NoteList empty={section.empty} notes={notes} actions={actions} />
      ) : (
        <div className="sx-row-shell">
          <button
            type="button"
            className="sx-row-arrow is-left"
            aria-label={`Show previous ${section.label} profiles`}
            onClick={() => scroller.current?.scrollBy({ left: -280, behavior: "smooth" })}
          >
            ‹
          </button>
          <ul className="sx-row" ref={scroller}>
            {notes.slice(0, LIKES_PREVIEW_LIMIT).map((note) => (
              <PreviewCard key={note.id} note={note} actions={actions} />
            ))}
          </ul>
          <button
            type="button"
            className="sx-row-arrow is-right"
            aria-label={`Show more ${section.label} profiles`}
            onClick={() => scroller.current?.scrollBy({ left: 280, behavior: "smooth" })}
          >
            ›
          </button>
        </div>
      )}
      {count > LIKES_PREVIEW_LIMIT ? (
        <div className="sx-view-all-center">
          <button type="button" className="sx-view-all" onClick={() => setExpanded((open) => !open)}>
            {expanded ? "Show less" : `View all ${count} profiles`} <span aria-hidden>{expanded ? "↑" : "→"}</span>
          </button>
        </div>
      ) : null}
    </section>
  );
}

function PreviewCard({ note, actions }: { note: InboxNote; actions?: (note: InboxNote) => ReactNode }) {
  const router = useRouter();
  const href = profileHref(note);
  return (
    <li
      className={`sx-card inbox-card inbox-profile${href ? " is-openable" : ""}`}
      onClick={(event) => {
        if (!href || (event.target as HTMLElement).closest(".inbox-actions, a.inbox-open")) return;
        router.push(href);
      }}
    >
      <CardFace note={note} actions={actions ? actions(note) : null} />
    </li>
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
  const facts = [note.age, note.height].filter(Boolean).join(" · ");
  const place = [note.city, note.state].filter(Boolean).join(", ");
  const tags = [[note.religion, note.community].filter(Boolean).join(" · "), note.education ?? "", note.occupation ?? ""].filter(Boolean);
  const inner = (
    <>
      {note.photoUrl ? (
        <Image src={note.photoUrl} alt="" fill sizes="(max-width: 640px) 50vw, 264px" quality={65} style={{ objectFit: "cover" }} />
      ) : (
        <span className="sx-initial">{note.name.slice(0, 1)}</span>
      )}
      {note.status ? <b className="sx-badge">{note.status}</b> : null}
      <div className="sx-photo-copy">
        <h3>{note.name}</h3>
        {facts ? <p>{facts}</p> : null}
      </div>
    </>
  );
  return (
    <div className="sx-card-link inbox-card-face">
      {href ? (
        <a href={href} className="sx-photo inbox-photo inbox-open">
          {inner}
        </a>
      ) : (
        <div className="sx-photo inbox-photo">{inner}</div>
      )}
      <div className="sx-body">
        {place ? <p className="sx-place">{place}</p> : null}
        {tags.length ? (
          <ul className="sx-tags">
            {tags.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        ) : null}
        {note.reason ? <p className="inbox-reason">{note.reason}</p> : null}
        <div className="sx-foot">
          <span>{note.when ? `${note.whenLabel ? `${note.whenLabel} · ` : ""}${note.when}` : note.lastOnline ?? ""}</span>
        </div>
        {actions ? <div className="inbox-actions sx-actions">{actions}</div> : null}
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
      <ul className="sx-grid is-results-list inbox-list">
        {shown.map((note) => {
          const href = profileHref(note);
          return (
          <li
            key={note.id}
            className={`sx-card inbox-card inbox-profile${href ? " is-openable" : ""}`}
            onClick={(event) => openProfile(event, href)}
          >
            <CardFace note={note} actions={actions ? actions(note) : null} />
          </li>
          );
        })}
      </ul>
      {pages > 1 ? (
        <nav className="sx-pager" aria-label="Profile pages">
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
