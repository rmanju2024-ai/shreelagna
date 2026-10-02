"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { sendPeekChat } from "@/app/app/match/actions";
import { chatStamp } from "@/lib/match/chat-ui";
import { btnPrimary, inputClass } from "@/lib/ui/classes";

type Msg = { id: string; sender_profile_id: string; body: string; created_at: string; pending?: boolean };

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
  const [, startTransition] = useTransition();
  const endRef = useRef<HTMLLIElement | null>(null);
  const boxRef = useRef<HTMLTextAreaElement | null>(null);

  const shown = useMemo(() => {
    const open = pending.filter(
      (row) => !messages.some((m) => m.sender_profile_id === row.sender_profile_id && m.body === row.body),
    );
    return [...messages, ...open];
  }, [messages, pending]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [shown.length]);

  function send() {
    const body = draft.trim();
    if (!body) return;
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
    const data = new FormData();
    data.set("thread_id", threadId);
    data.set("body", body);
    startTransition(async () => {
      const result = await sendPeekChat(data).catch(() => null);
      if (!result || !result.ok) {
        setPending((prev) => prev.filter((row) => row.id !== temp.id));
        setDraft(body);
        setFailed(true);
      }
    });
  }

  return (
    <>
      <div className="wa-stage">
        <ul className="wa-stream">
          {shown.map((msg, index) => (
            <li
              key={msg.id}
              ref={index === shown.length - 1 ? endRef : undefined}
              className={`wa-bubble ${msg.sender_profile_id === myProfileId ? "is-mine" : "is-theirs"}`}
            >
              <p>{msg.body}</p>
              <time>
                {msg.pending ? "" : chatStamp(msg.created_at)}
                {msg.sender_profile_id === myProfileId ? (
                  <span className={`wa-tick${msg.pending ? " is-wait" : ""}`} aria-label={msg.pending ? "Sending" : "Sent"}>
                    {msg.pending ? "🕓" : "✓✓"}
                  </span>
                ) : null}
              </time>
            </li>
          ))}
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
          <textarea
            ref={boxRef}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                send();
              }
            }}
            maxLength={4000}
            rows={1}
            className={inputClass}
            placeholder={failed ? "Not sent — try again" : "Message"}
            aria-label="Message"
          />
          <button type="submit" className={`${btnPrimary} wa-send`} aria-label="Send" disabled={!draft.trim()}>
            ➤
          </button>
        </form>
      ) : null}
    </>
  );
}
