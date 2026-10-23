"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { deleteChatMessage, editChatMessage, sendPeekChat } from "@/app/app/match/actions";
import { chatBodyLine, chatStamp } from "@/lib/match/chat-ui";
import { btnPrimary, inputClass } from "@/lib/ui/classes";

type Msg = {
  id: string;
  sender_profile_id: string;
  body: string;
  created_at: string;
  read_at?: string | null;
  edited_at?: string | null;
  deleted_at?: string | null;
  pending?: boolean;
};

/** Chat stream + composer. Sending stays on the page: the message appears at once and the box keeps focus. */
export function ThreadView({
  threadId,
  myProfileId,
  messages,
  canSend,
}: {
  threadId: string;
  myProfileId: string;
  messages: Msg[];
  canSend: boolean;
}) {
  const [pending, setPending] = useState<Msg[]>([]);
  const [draft, setDraft] = useState("");
  const [failed, setFailed] = useState(false);
  const [menuId, setMenuId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [goneIds, setGoneIds] = useState<string[]>([]);
  const [, startTransition] = useTransition();
  const endRef = useRef<HTMLLIElement | null>(null);
  const boxRef = useRef<HTMLTextAreaElement | null>(null);
  const sendLockRef = useRef(false);

  const shown = useMemo(() => {
    const open = pending.filter(
      (row) => !messages.some((m) => m.sender_profile_id === row.sender_profile_id && m.body === row.body),
    );
    return [...messages, ...open];
  }, [messages, pending]);

  useEffect(() => {
    endRef.current?.scrollIntoView?.({ block: "end" });
  }, [shown.length]);

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

  return (
    <>
      <div className="wa-stage">
        <ul className="wa-stream">
          {shown.map((msg, index) => {
            const mine = msg.sender_profile_id === myProfileId;
            const gone = Boolean(msg.deleted_at) || goneIds.includes(msg.id);
            return (
              <li
                key={msg.id}
                ref={index === shown.length - 1 ? endRef : undefined}
                className={`wa-bubble ${mine ? "is-mine" : "is-theirs"}${gone ? " is-deleted" : ""}${menuId === msg.id ? " is-open" : ""}`}
              >
                {mine && !msg.pending && !gone ? (
                  <div className="wa-msg-tools">
                    <button
                      type="button"
                      className="wa-msg-more"
                      aria-label="Message options"
                      aria-expanded={menuId === msg.id}
                      onClick={() => setMenuId((current) => (current === msg.id ? null : msg.id))}
                    >
                      ⋯
                    </button>
                    {menuId === msg.id ? (
                      <div className="wa-msg-menu" role="menu">
                        <button type="button" role="menuitem" onClick={() => beginEdit(msg)}>
                          Edit
                        </button>
                        <button type="button" role="menuitem" className="is-danger" onClick={() => remove(msg)}>
                          Delete
                        </button>
                      </div>
                    ) : null}
                  </div>
                ) : null}
                <p>{chatBodyLine(msg.body, gone)}</p>
                <time>
                  {msg.pending ? "" : chatStamp(msg.created_at)}
                  {msg.edited_at && !gone ? " · edited" : ""}
                  {mine ? (
                    <span
                      className={`wa-tick${msg.pending ? " is-wait" : msg.read_at ? " is-read" : ""}`}
                      aria-label={msg.pending ? "Sending" : msg.read_at ? "Read" : "Delivered"}
                    >
                      {msg.pending ? "🕓" : "✓✓"}
                    </span>
                  ) : null}
                </time>
              </li>
            );
          })}
        </ul>
      </div>
      {canSend ? (
        <form
          className="wa-composer"
          onSubmit={(event) => {
            event.preventDefault();
            send();
          }}
        >
          {editingId ? (
            <button
              type="button"
              className="wa-edit-cancel"
              onClick={() => {
                setEditingId(null);
                setDraft("");
              }}
            >
              Cancel edit
            </button>
          ) : null}
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
            className={inputClass}
            placeholder={editingId ? "Edit message" : failed ? "Not sent — try again" : "Message"}
            aria-label={editingId ? "Edit message" : "Message"}
          />
          <button type="submit" className={`${btnPrimary} wa-send`} aria-label={editingId ? "Save edit" : "Send"} disabled={!draft.trim()}>
            ➤
          </button>
        </form>
      ) : null}
    </>
  );
}
