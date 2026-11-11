"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useTransition, type ReactNode } from "react";
import { deleteChatMessage, editChatMessage, sendPeekChat } from "@/app/app/match/actions";
import { ChatAvatar } from "@/app/app/chat/chat-avatar";
import { chatBodyLine, chatStamp } from "@/lib/match/chat-ui";
import { buildSalonRows, messageMatchesQuery, type SalonMsg } from "@/lib/match/salon-thread";

type Msg = SalonMsg;

export function ThreadView({
  threadId,
  myProfileId,
  messages,
  canSend,
  peerName,
  peerPhoto,
  peerHref,
  presence,
  online,
  closedNote,
}: {
  threadId: string;
  myProfileId: string;
  messages: Msg[];
  canSend: boolean;
  peerName: string;
  peerPhoto?: string | null;
  peerHref?: string | null;
  presence: string;
  online: boolean;
  closedNote?: ReactNode;
}) {
  const [pending, setPending] = useState<Msg[]>([]);
  const [draft, setDraft] = useState("");
  const [failed, setFailed] = useState(false);
  const [menuId, setMenuId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [goneIds, setGoneIds] = useState<string[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [headMenu, setHeadMenu] = useState(false);
  const [, startTransition] = useTransition();
  const endRef = useRef<HTMLLIElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const boxRef = useRef<HTMLTextAreaElement | null>(null);
  const sendLockRef = useRef(false);
  const holdRef = useRef<number | null>(null);

  const shown = useMemo(() => {
    const open = pending.filter(
      (row) => !messages.some((m) => m.sender_profile_id === row.sender_profile_id && m.body === row.body),
    );
    return [...messages, ...open];
  }, [messages, pending]);

  const rows = useMemo(() => buildSalonRows(shown, myProfileId, peerName), [shown, myProfileId, peerName]);
  const q = query.trim();

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    stage.scrollTop = stage.scrollHeight;
  }, [shown.length]);

  useEffect(() => {
    if (!menuId && !headMenu) return;
    function close(event: PointerEvent) {
      const node = event.target;
      if (node instanceof Element && node.closest(".salon-note.is-open, .salon-tools")) return;
      setMenuId(null);
      setHeadMenu(false);
    }
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [menuId, headMenu]);

  function send() {
    if (sendLockRef.current) return;
    const body = draft.trim();
    if (!body) return;
    sendLockRef.current = true;
    const data = new FormData();
    data.set("thread_id", threadId);
    data.set("body", body);
    if (editingId) {
      data.set("message_id", editingId);
      setDraft("");
      setEditingId(null);
      setMenuId(null);
      boxRef.current?.focus();
      startTransition(async () => {
        const result = await editChatMessage(data).catch(() => null);
        sendLockRef.current = false;
        if (!result || !result.ok) {
          setDraft(body);
          setEditingId(editingId);
          setFailed(true);
        }
      });
      return;
    }
    const temp: Msg = {
      id: `tmp-${Date.now()}`,
      sender_profile_id: myProfileId,
      body,
      created_at: new Date().toISOString(),
      pending: true,
    };
    setPending((prev) => [...prev, temp]);
    setDraft("");
    setFailed(false);
    boxRef.current?.focus();
    startTransition(async () => {
      const result = await sendPeekChat(data).catch(() => null);
      sendLockRef.current = false;
      if (!result || !result.ok) {
        setPending((prev) => prev.filter((row) => row.id !== temp.id));
        setDraft(body);
        setFailed(true);
      }
    });
  }

  function beginEdit(msg: Msg) {
    setMenuId(null);
    setEditingId(msg.id);
    setDraft(msg.body);
    boxRef.current?.focus();
  }

  function clearHold() {
    if (holdRef.current) window.clearTimeout(holdRef.current);
    holdRef.current = null;
  }

  function startHold(msg: Msg, mine: boolean, gone: boolean) {
    if (!mine || gone || msg.pending) return;
    clearHold();
    holdRef.current = window.setTimeout(() => setMenuId(msg.id), 420);
  }

  function remove(msg: Msg) {
    setMenuId(null);
    setGoneIds((prev) => (prev.includes(msg.id) ? prev : [...prev, msg.id]));
    const data = new FormData();
    data.set("thread_id", threadId);
    data.set("message_id", msg.id);
    startTransition(async () => {
      await deleteChatMessage(data).catch(() => null);
    });
  }

  const person = (
    <>
      <ChatAvatar name={peerName} src={peerPhoto} size="sm" />
      <div>
        <h1>{peerName}</h1>
        <p className="salon-status">
          {online ? <span className="salon-dot" aria-hidden /> : null}
          {presence || "\u00a0"}
        </p>
      </div>
    </>
  );

  return (
    <article className="salon-chat wa-app wc-pane">
      <header className="salon-head">
        <Link href="/app/chat" className="salon-back" aria-label="All chats">
          ‹
        </Link>
        {peerHref ? (
          <Link href={peerHref} className="salon-person">
            {person}
          </Link>
        ) : (
          <div className="salon-person">{person}</div>
        )}
        <div className="salon-tools">
          <button
            type="button"
            className="salon-icon"
            aria-label="Search in chat"
            aria-expanded={searchOpen}
            onClick={() => setSearchOpen((open) => !open)}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
              <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.6" />
              <path d="M16 16.5 20 20.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>
          <button
            type="button"
            className="salon-icon"
            aria-label="Chat menu"
            aria-expanded={headMenu}
            onClick={() => setHeadMenu((open) => !open)}
          >
            ⋯
          </button>
          {searchOpen ? (
            <input
              className="salon-search-box"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search this chat"
              aria-label="Search this chat"
              autoFocus
            />
          ) : null}
          {headMenu && peerHref ? (
            <div className="salon-head-menu" role="menu">
              <Link href={peerHref} role="menuitem" onClick={() => setHeadMenu(false)}>
                View profile
              </Link>
            </div>
          ) : null}
        </div>
      </header>
      <div className="salon-stage wa-stage" ref={stageRef}>
        <ul className="salon-stream">
          {rows.map((row, index) => {
            if (row.kind === "day") {
              return (
                <li key={row.key} className="salon-day">
                  {row.label}
                </li>
              );
            }
            if (row.kind === "unread") {
              return (
                <li key="unread" className="salon-unread">
                  New messages
                </li>
              );
            }
            const msg = row.msg;
            const gone = Boolean(msg.deleted_at) || goneIds.includes(msg.id);
            const hit = q && !gone && messageMatchesQuery(msg.body, q);
            const dim = q && !hit;
            return (
              <li
                key={msg.id}
                ref={index === rows.length - 1 ? endRef : undefined}
                className={`salon-note ${row.mine ? "is-mine" : "is-theirs"}${row.tight ? " is-tight" : ""}${gone ? " is-deleted" : ""}${menuId === msg.id ? " is-open" : ""}${hit ? " is-hit" : ""}`}
                style={dim ? { opacity: 0.35 } : undefined}
                onPointerDown={() => startHold(msg, row.mine, gone)}
                onPointerUp={clearHold}
                onPointerCancel={clearHold}
                onPointerLeave={clearHold}
                onContextMenu={(event) => {
                  if (!row.mine || gone || msg.pending) return;
                  event.preventDefault();
                  setMenuId(msg.id);
                }}
              >
                {row.mine && !msg.pending && !gone ? (
                  <div className="salon-msg-tools">
                    <button
                      type="button"
                      className="salon-msg-more"
                      aria-label="Message options"
                      aria-expanded={menuId === msg.id}
                      onClick={() => setMenuId((current) => (current === msg.id ? null : msg.id))}
                    >
                      ⋯
                    </button>
                    {menuId === msg.id ? (
                      <div className="salon-msg-menu" role="menu">
                        <button type="button" role="menuitem" className="salon-menu-item" onClick={() => beginEdit(msg)}>
                          Edit
                        </button>
                        <button
                          type="button"
                          role="menuitem"
                          className="salon-menu-item is-danger"
                          onClick={() => remove(msg)}
                        >
                          Delete
                        </button>
                      </div>
                    ) : null}
                  </div>
                ) : null}
                {row.showName ? <span className="salon-who">{row.label}</span> : null}
                <p>{chatBodyLine(msg.body, gone)}</p>
                <time>
                  {msg.pending ? "Sending" : chatStamp(msg.created_at)}
                  {msg.edited_at && !gone ? " · edited" : ""}
                  {row.showSeen ? " · Seen" : ""}
                </time>
              </li>
            );
          })}
        </ul>
      </div>
      {canSend ? (
        <form
          className="salon-composer"
          onSubmit={(event) => {
            event.preventDefault();
            send();
          }}
        >
          {editingId ? (
            <button
              type="button"
              className="salon-edit-cancel"
              onClick={() => {
                setEditingId(null);
                setDraft("");
              }}
            >
              Cancel edit
            </button>
          ) : null}
          <button type="button" className="salon-attach" aria-label="Attach a file" disabled>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M8 12.5 14.2 6.3a3.1 3.1 0 1 1 4.4 4.4l-7.5 7.5a4.4 4.4 0 0 1-6.2-6.2l7-7"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
          </button>
          <textarea
            ref={boxRef}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Escape" && editingId) {
                setEditingId(null);
                setDraft("");
                return;
              }
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                send();
              }
            }}
            maxLength={4000}
            rows={1}
            placeholder={editingId ? "Edit your note" : failed ? "Not sent — try again" : "Write a message…"}
            aria-label={editingId ? "Edit your note" : "Write a message…"}
          />
          <button type="submit" className="salon-send" aria-label={editingId ? "Save edit" : "Send"} disabled={!draft.trim()}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M4 12h14M12 5l8 7-8 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </form>
      ) : null}
      {closedNote}
    </article>
  );
}
