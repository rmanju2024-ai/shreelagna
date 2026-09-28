"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { cancelInterest, sendInterest } from "@/app/app/profiles/actions";
import { sendChat } from "@/app/app/match/actions";
import type { InterestThread } from "@/lib/match/interest-status";
import { chatStamp } from "@/lib/match/chat-ui";
import Link from "next/link";

export type PeekChatNote = {
  id: string;
  sender_profile_id: string;
  body: string;
  created_at: string;
};

type Phase = "enter" | "idle" | "peck" | "send" | "deliver";

function GoldBird({ carry }: { carry?: "heart" | "mail" | null }) {
  return (
    <svg className="gold-bird-svg" viewBox="0 0 72 48" aria-hidden>
      <g className="gold-bird-body">
        <ellipse cx="34" cy="28" rx="16" ry="10" fill="#fde68a" />
        <ellipse cx="38" cy="26" rx="12" ry="8" fill="#e8b84a" />
        <circle cx="52" cy="20" r="7.2" fill="#f5c84c" />
        <circle cx="54.5" cy="18.5" r="1.6" fill="#3f0e0d" />
        <path d="M58 21 L66 23 L58 25 Z" fill="#9a3412" />
        <g className="gold-bird-wing">
          <path d="M28 24 C12 8 8 22 24 30 C18 22 24 16 28 24 Z" fill="#d4a017" />
        </g>
        <path d="M18 30 C12 34 10 40 16 38 C22 36 22 32 18 30 Z" fill="#b45309" />
        <path d="M48 36 L50 44 L46 42 Z" fill="#7c2d12" />
        <path d="M42 36 L43 44 L39 41 Z" fill="#7c2d12" />
      </g>
      {carry === "heart" ? (
        <path className="gold-bird-heart" d="M12 14 C12 10 18 10 18 14 C18 10 24 10 24 14 C24 20 18 24 18 24 C18 24 12 20 12 14 Z" fill="#be123c" />
      ) : null}
      {carry === "mail" ? (
        <g className="gold-bird-mail">
          <rect x="8" y="6" width="16" height="11" rx="1.5" fill="#fff8e7" stroke="#b8894c" />
          <path d="M8 6 L16 13 L24 6" fill="none" stroke="#6f1d1b" strokeWidth="1.4" />
        </g>
      ) : null}
    </svg>
  );
}

export function BirdDock({
  profileId,
  interestId,
  thread,
  canSend,
  needPlan,
  needQuota,
  quotaLeft,
  finishHref,
  chat,
}: {
  profileId: string;
  interestId: string | null;
  thread: InterestThread;
  canSend: boolean;
  needPlan: boolean;
  needQuota: boolean;
  quotaLeft: number | null;
  finishHref: string;
  chat?: {
    myProfileId: string | null;
    threadId: string | null;
    notes: PeekChatNote[];
    live: boolean;
  };
}) {
  const [mounted, setMounted] = useState(false);
  const [phase, setPhase] = useState<Phase>("enter");
  const [open, setOpen] = useState(false);
  const [badge, setBadge] = useState(0);
  const acted = useRef(false);
  const inbound = useRef(0);
  const [, startTransition] = useTransition();
  const showChat = thread === "sent" || thread === "received" || thread === "accepted";
  const returnTo = `/browse/${profileId}`;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const theirs = (chat?.notes ?? []).filter((note) => note.sender_profile_id !== chat?.myProfileId).length;
    if (theirs > inbound.current && inbound.current > 0) {
      setBadge((n) => n + (theirs - inbound.current));
      setPhase("deliver");
      const t = window.setTimeout(() => setPhase("idle"), 1000);
      inbound.current = theirs;
      return () => window.clearTimeout(t);
    }
    if (inbound.current === 0 && theirs) setBadge(theirs);
    inbound.current = theirs;
  }, [chat?.notes, chat?.myProfileId]);

  useEffect(() => {
    if (!mounted) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setPhase("idle");
      return;
    }
    const land = window.setTimeout(() => setPhase("idle"), 1000);
    return () => window.clearTimeout(land);
  }, [mounted]);

  useEffect(() => {
    if (phase !== "idle" || acted.current) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    const tick = window.setInterval(() => {
      if (acted.current || document.hidden) return;
      setPhase("peck");
      window.setTimeout(() => setPhase((p) => (p === "peck" ? "idle" : p)), 900);
    }, 17000);
    return () => window.clearInterval(tick);
  }, [phase, mounted]);

  function markActed() {
    acted.current = true;
  }

  function playThen(next: Phase, after: () => void) {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      after();
      return;
    }
    setPhase(next);
    window.setTimeout(() => {
      setPhase("idle");
      after();
    }, 1000);
  }

  function onSpark(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    markActed();
    const data = new FormData(event.currentTarget);
    playThen("send", () => {
      startTransition(() => {
        void sendInterest(data);
      });
    });
  }

  function openChat() {
    markActed();
    setOpen(true);
    setBadge(0);
  }

  const perchLabel =
    thread === "sent"
      ? "Drop Interest"
      : thread === "accepted"
        ? "Interest sent"
        : thread === "received"
          ? "They reached first"
          : needPlan
            ? "Unlock & spark"
            : needQuota
              ? "More sparks"
              : canSend
                ? "Spark interest"
                : "Finish profile";

  if (!mounted) return null;

  const dock = (
    <div className={`bird-dock${open ? " is-open" : ""}`} data-phase={phase} data-thread={thread}>
      {open && showChat ? (
        <section className="bird-dock-sheet" aria-label="Private chat">
          <header className="bird-dock-sheet-head">
            <p>Private line</p>
            <button type="button" onClick={() => setOpen(false)}>
              Close
            </button>
          </header>
          <ul className="bird-dock-stream">
            {(chat?.notes ?? []).length ? (
              (chat?.notes ?? []).map((note) => (
                <li
                  key={note.id}
                  className={`bird-dock-bubble ${note.sender_profile_id === chat?.myProfileId ? "is-mine" : "is-theirs"}`}
                >
                  <p>{note.body}</p>
                  <time>{chatStamp(note.created_at)}</time>
                </li>
              ))
            ) : (
              <li className="bird-dock-empty">Say hi. Keep it warm and short.</li>
            )}
          </ul>
          {chat?.live === false ? (
            <p className="bird-dock-lock">
              A live plan keeps this line open. <Link href="/app/plans">Open plans</Link>
            </p>
          ) : (
            <form action={sendChat} className="bird-dock-composer">
              {chat?.threadId ? <input type="hidden" name="thread_id" value={chat.threadId} /> : null}
              <input type="hidden" name="to_profile_id" value={profileId} />
              <input type="hidden" name="next" value={returnTo} />
              <textarea name="body" required maxLength={4000} rows={2} placeholder="Type a private note…" />
              <button type="submit">Send</button>
            </form>
          )}
        </section>
      ) : null}

      <div className="bird-dock-stage">
        <span className="bird-dock-actor" aria-hidden>
          <GoldBird carry={phase === "send" ? "heart" : phase === "deliver" ? "mail" : null} />
        </span>

        {thread === "none" && canSend ? (
          <form action={sendInterest} onSubmit={onSpark}>
            <input type="hidden" name="to_profile_id" value={profileId} />
            <button type="submit" className="bird-dock-cta">
              {phase === "send" ? "Interest sent" : perchLabel}
              {quotaLeft !== null && phase !== "send" ? ` · ${quotaLeft}` : ""}
            </button>
          </form>
        ) : null}

        {thread === "none" && needPlan ? (
          <Link href="/app/plans" className="bird-dock-cta">
            {perchLabel}
          </Link>
        ) : null}

        {thread === "none" && needQuota ? (
          <Link href="/app/plans" className="bird-dock-cta">
            {perchLabel}
          </Link>
        ) : null}

        {thread === "none" && !canSend && !needPlan && !needQuota ? (
          <Link href={finishHref} className="bird-dock-cta">
            {perchLabel}
          </Link>
        ) : null}

        {thread === "closed" && canSend ? (
          <form action={sendInterest} onSubmit={onSpark}>
            <input type="hidden" name="to_profile_id" value={profileId} />
            <button type="submit" className="bird-dock-cta">
              {phase === "send" ? "Interest sent" : "Spark interest"}
            </button>
          </form>
        ) : null}

        {thread === "sent" && interestId ? (
          <form action={cancelInterest}>
            <input type="hidden" name="to_profile_id" value={profileId} />
            <input type="hidden" name="interest_id" value={interestId} />
            <button type="submit" className="bird-dock-cta is-drop">
              Drop Interest
            </button>
          </form>
        ) : null}

        {thread === "accepted" ? (
          <button type="button" className="bird-dock-cta is-sent" onClick={openChat}>
            Interest sent
          </button>
        ) : null}

        {thread === "received" ? (
          <Link href="/app/interests" className="bird-dock-cta">
            Reply now
          </Link>
        ) : null}

        {showChat ? (
          <button type="button" className={`bird-dock-chat${badge ? " has-mail" : ""}`} onClick={openChat} aria-label="Open chat">
            <span className="bird-dock-chat-face" aria-hidden>
              ✉
            </span>
            {badge > 0 ? <i>{badge > 9 ? "9+" : badge}</i> : null}
          </button>
        ) : null}
      </div>
    </div>
  );

  return createPortal(dock, document.body);
}
