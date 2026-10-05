"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { cancelInterest, sendInterest } from "@/app/app/profiles/actions";
import { markPeekRead, sendPeekChat } from "@/app/app/match/actions";
import { ChatAvatar } from "@/app/app/chat/chat-avatar";
import type { InterestThread } from "@/lib/match/interest-status";
import { chatStamp } from "@/lib/match/chat-ui";
import Link from "next/link";

export type PeekChatNote = {
  id: string;
  sender_profile_id: string;
  body: string;
  created_at: string;
  read_at?: string | null;
  pending?: boolean;
};

type Phase = "enter" | "idle" | "peck" | "send" | "deliver";

const CHIRPS: Record<string, string[]> = {
  none: ["Don't just look. Spark it.", "Cute? Then say so.", "One tap. A whole story.", "Stars like this one."],
  sent: ["They're thinking. Say hi.", "Interest is in. Don't go quiet.", "A short note goes far."],
  received: ["They blinked first. Reply.", "Don't freeze. Write back."],
  accepted: ["Green light. Talk now.", "Hearts are waiting."],
  closed: ["Fresh start. Spark again."],
  plan: ["Unlock, then spark."],
  quota: ["More sparks on a plan."],
  finish: ["Finish your profile, then send a request."],
  review: ["Your profile is complete. Waiting for review."],
  peck: ["Tap me. I'm waiting."],
};

function chirpPool(
  thread: InterestThread,
  needPlan: boolean,
  needQuota: boolean,
  canSend: boolean,
  awaitingReview: boolean,
) {
  if (thread === "none" && needPlan) return CHIRPS.plan;
  if (thread === "none" && needQuota) return CHIRPS.quota;
  if (thread === "none" && awaitingReview) return CHIRPS.review;
  if (thread === "none" && !canSend) return CHIRPS.finish;
  return CHIRPS[thread] ?? CHIRPS.none;
}

function dayLabel(iso: string) {
  const at = new Date(iso);
  if (Number.isNaN(at.getTime())) return "";
  const today = new Date();
  const sameDay = at.toDateString() === today.toDateString();
  if (sameDay) return "Today";
  const y = new Date(today);
  y.setDate(today.getDate() - 1);
  if (at.toDateString() === y.toDateString()) return "Yesterday";
  return at.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function Tick({ mine, pending, read }: { mine: boolean; pending?: boolean; read?: boolean }) {
  if (!mine) return null;
  if (pending) return <span className="bird-wa-tick">✓</span>;
  if (read) return <span className="bird-wa-tick is-read">✓✓</span>;
  return <span className="bird-wa-tick">✓</span>;
}

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
        <path
          className="gold-bird-heart"
          d="M12 14 C12 10 18 10 18 14 C18 10 24 10 24 14 C24 20 18 24 18 24 C18 24 12 20 12 14 Z"
          fill="#be123c"
        />
      ) : null}
      {carry === "mail" ? (
        <g className="gold-bird-mail">
          <rect x="6" y="4" width="18" height="12" rx="1.6" fill="#fff8e7" stroke="#b8894c" />
          <path d="M6 4 L15 12 L24 4" fill="none" stroke="#6f1d1b" strokeWidth="1.4" />
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
  awaitingReview = false,
  quotaLeft,
  finishHref,
  chat,
  inline = false,
}: {
  profileId: string;
  interestId: string | null;
  thread: InterestThread;
  canSend: boolean;
  needPlan: boolean;
  needQuota: boolean;
  awaitingReview?: boolean;
  quotaLeft: number | null;
  finishHref: string;
  inline?: boolean;
  chat?: {
    myProfileId: string | null;
    threadId: string | null;
    notes: PeekChatNote[];
    live: boolean;
    name: string;
    photo: string | null;
    seen: string | null;
  };
}) {
  const [mounted, setMounted] = useState(false);
  const [phase, setPhase] = useState<Phase>("enter");
  const [open, setOpen] = useState(false);
  const [wide, setWide] = useState(false);
  const [badge, setBadge] = useState(0);
  const [line, setLine] = useState(0);
  const [draft, setDraft] = useState("");
  const [extra, setExtra] = useState<PeekChatNote[]>([]);
  const acted = useRef(false);
  const inbound = useRef(0);
  const endRef = useRef<HTMLDivElement | null>(null);
  const storeKey = `sl-bird-chat:${profileId}`;
  const [, startTransition] = useTransition();
  const showChat = thread === "sent" || thread === "received" || thread === "accepted";
  const pool = phase === "peck" ? CHIRPS.peck : chirpPool(thread, needPlan, needQuota, canSend, awaitingReview);
  const chirp = pool[line % pool.length];
  const name = chat?.name ?? "Match";
  const [liveNotes, setLiveNotes] = useState<PeekChatNote[]>([]);
  const [liveRead, setLiveRead] = useState<Record<string, string>>({});
  const notes = useMemo(() => {
    const base = chat?.notes ?? [];
    const seen = new Set(base.map((note) => note.id));
    const server = [...base, ...liveNotes.filter((note) => !seen.has(note.id))].map((note) =>
      liveRead[note.id] ? { ...note, read_at: liveRead[note.id] } : note,
    );
    const pending = extra.filter(
      (row) =>
        !server.some(
          (note) => note.body === row.body && note.sender_profile_id === row.sender_profile_id,
        ),
    );
    return [...server, ...pending];
  }, [chat?.notes, extra, liveNotes, liveRead]);

  // Realtime: new messages and read receipts arrive without reloading the page.
  const threadId = chat?.threadId ?? null;
  const myProfileId = chat?.myProfileId ?? null;
  const openRef = useRef(open);
  useEffect(() => {
    openRef.current = open;
  }, [open]);
  useEffect(() => {
    if (!threadId) return;
    let cleanup = () => {};
    void import("@/lib/supabase/client").then(({ createClient }) => {
      const supabase = createClient();
      const channel = supabase
        .channel(`peek-chat:${threadId}`)
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "messages", filter: `thread_id=eq.${threadId}` },
          (payload) => {
            const row = payload.new as PeekChatNote;
            setLiveNotes((prev) => (prev.some((note) => note.id === row.id) ? prev : [...prev, row]));
            if (row.sender_profile_id !== myProfileId) {
              if (!openRef.current) setBadge((n) => n + 1);
              setPhase("deliver");
              window.setTimeout(() => setPhase("idle"), 1000);
            }
          },
        )
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "messages", filter: `thread_id=eq.${threadId}` },
          (payload) => {
            const row = payload.new as PeekChatNote;
            if (row.read_at) setLiveRead((prev) => ({ ...prev, [row.id]: row.read_at as string }));
          },
        )
        .subscribe();
      cleanup = () => void supabase.removeChannel(channel);
    });
    return () => cleanup();
  }, [threadId, myProfileId]);

  useEffect(() => {
    setMounted(true);
    try {
      const saved = sessionStorage.getItem(storeKey);
      if (saved) {
        const parsed = JSON.parse(saved) as { open?: boolean; wide?: boolean };
        if (parsed.open) setOpen(true);
        if (parsed.wide) setWide(true);
      }
    } catch {
      /* ignore */
    }
  }, [storeKey]);

  useEffect(() => {
    if (!mounted) return;
    sessionStorage.setItem(storeKey, JSON.stringify({ open, wide }));
  }, [open, wide, mounted, storeKey]);

  useEffect(() => {
    setLine(0);
  }, [thread, needPlan, needQuota, canSend, awaitingReview]);

  useEffect(() => {
    const id = window.setInterval(() => setLine((n) => n + 1), 6500);
    return () => window.clearInterval(id);
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
    if (inbound.current === 0 && theirs && !open) setBadge(theirs);
    inbound.current = theirs;
  }, [chat?.notes, chat?.myProfileId, open]);

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

  useEffect(() => {
    if (open) endRef.current?.scrollIntoView({ block: "end" });
  }, [open, notes]);

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
    const rect = event.currentTarget.getBoundingClientRect();
    for (let i = 0; i < 3; i += 1) {
      const fly = document.createElement("span");
      fly.className = "pv-butterfly";
      fly.textContent = "🦋";
      fly.style.left = `${rect.left + rect.width / 2 + (i - 1) * 22}px`;
      fly.style.top = `${rect.top}px`;
      fly.style.animationDelay = `${i * 0.12}s`;
      document.body.appendChild(fly);
      window.setTimeout(() => fly.remove(), 1800);
    }
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
    const data = new FormData();
    if (chat?.threadId) data.set("thread_id", chat.threadId);
    data.set("to_profile_id", profileId);
    void markPeekRead(data);
  }

  function closeChat() {
    setOpen(false);
    setWide(false);
  }

  function onSend(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = draft.trim();
    if (!text) return;
    markActed();
    setOpen(true);
    setDraft("");
    setExtra((rows) => [
      ...rows,
      {
        id: `local-${Date.now()}`,
        sender_profile_id: chat?.myProfileId ?? "me",
        body: text,
        created_at: new Date().toISOString(),
        pending: true,
      },
    ]);
    const data = new FormData();
    if (chat?.threadId) data.set("thread_id", chat.threadId);
    data.set("to_profile_id", profileId);
    data.set("body", text);
    startTransition(() => {
      void sendPeekChat(data);
    });
  }

  const perchLabel =
    phase === "send"
      ? "Interest sent"
      : thread === "sent"
        ? "Cancel Interest"
        : thread === "accepted"
          ? "Interest sent"
          : thread === "received"
            ? "Reply now"
            : needPlan
              ? "Unlock & send"
              : needQuota
                ? "More requests"
                : canSend
                  ? "Send request"
                  : awaitingReview
                    ? "Awaiting review"
                    : "Finish profile";

  const dock = (
    <div className={`bird-dock${open ? " is-open" : ""}${wide ? " is-wide" : ""}${inline ? " is-inline" : ""}`} data-phase={phase} data-thread={thread}>
      {wide ? <button type="button" className="bird-wa-scrim" aria-label="Restore chat" onClick={() => setWide(false)} /> : null}
      {open && showChat ? (
        <section className={`bird-wa${wide ? " is-max" : ""}`} aria-label="Chat">
          <header className="bird-wa-head">
            <ChatAvatar name={name} src={chat?.photo} size={wide ? "md" : "sm"} />
            <div className="bird-wa-who">
              <h2>{name}</h2>
              <p>{chat?.seen ?? "tap to chat"}</p>
            </div>
            <div className="bird-wa-tools">
              <button type="button" className="bird-wa-icon" onClick={() => setWide((on) => !on)} aria-label={wide ? "Restore" : "Maximize"}>
                {wide ? "↙" : "↗"}
              </button>
              <button type="button" className="bird-wa-icon" onClick={closeChat} aria-label="Close">
                ✕
              </button>
            </div>
          </header>
          <div className="bird-wa-stage">
            <ul className="bird-wa-stream">
              {notes.length ? (
                notes.map((note, index, all) => {
                  const mine = note.sender_profile_id === chat?.myProfileId;
                  const prev = all[index - 1];
                  const stamp = dayLabel(note.created_at);
                  const showDay = !prev || dayLabel(prev.created_at) !== stamp;
                  return (
                    <li key={note.id}>
                      {showDay && stamp ? <p className="bird-wa-day">{stamp}</p> : null}
                      <div
                        className={`bird-wa-row ${mine ? "is-mine" : "is-theirs"}`}
                        ref={index === all.length - 1 ? endRef : undefined}
                      >
                        {!mine ? <ChatAvatar name={name} src={chat?.photo} size="sm" /> : null}
                        <div className="bird-wa-bubble">
                          <p>{note.body}</p>
                          <time>
                            {chatStamp(note.created_at)}
                            <Tick mine={mine} pending={note.pending} read={Boolean(note.read_at)} />
                          </time>
                        </div>
                      </div>
                    </li>
                  );
                })
              ) : (
                <li className="bird-wa-empty">Say hi. Keep it warm and short.</li>
              )}
            </ul>
          </div>
          {chat?.live === false ? (
            <p className="bird-wa-lock">
              A live plan keeps this chat open. <Link href="/app/plans">Open plans</Link>
            </p>
          ) : (
            <form onSubmit={onSend} className="bird-wa-composer">
              <textarea
                name="body"
                required
                maxLength={4000}
                rows={1}
                placeholder="Message"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    event.currentTarget.form?.requestSubmit();
                  }
                }}
              />
              <button type="submit" className="bird-wa-send" aria-label="Send" disabled={!draft.trim()}>
                ➤
              </button>
            </form>
          )}
        </section>
      ) : null}

      <p className="bird-chirp" aria-live="polite">
        {chirp}
      </p>

      <div className="bird-dock-stage">
        <span className="bird-dock-actor" aria-hidden>
          <GoldBird carry={phase === "send" ? "heart" : phase === "deliver" ? "mail" : null} />
        </span>

        {thread === "none" && canSend ? (
          <form action={sendInterest} onSubmit={onSpark}>
            <input type="hidden" name="to_profile_id" value={profileId} />
            <button type="submit" className="bird-dock-cta">
              {perchLabel}
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

        {thread === "none" && !canSend && !needPlan && !needQuota && !awaitingReview ? (
          <Link href={finishHref} className="bird-dock-cta">
            {perchLabel}
          </Link>
        ) : null}

        {thread === "none" && awaitingReview && !needPlan && !needQuota ? (
          <span className="bird-dock-cta" aria-disabled>
            {perchLabel}
          </span>
        ) : null}

        {thread === "closed" && canSend ? (
          <form action={sendInterest} onSubmit={onSpark}>
            <input type="hidden" name="to_profile_id" value={profileId} />
            <button type="submit" className="bird-dock-cta">
              {perchLabel}
            </button>
          </form>
        ) : null}

        {thread === "sent" ? (
          interestId ? (
            <form action={cancelInterest}>
              <input type="hidden" name="to_profile_id" value={profileId} />
              <input type="hidden" name="interest_id" value={interestId} />
              <button type="submit" className="bird-dock-cta is-drop">
                Cancel Interest
              </button>
            </form>
          ) : (
            <button type="button" className="bird-dock-cta is-sent">
              Interest sent
            </button>
          )
        ) : null}

        {thread === "accepted" ? (
          <button type="button" className="bird-dock-cta is-sent" onClick={openChat}>
            Interest sent
          </button>
        ) : null}

        {thread === "received" ? (
          <Link href="/app/interests" className="bird-dock-cta">
            {perchLabel}
          </Link>
        ) : null}

        {showChat ? (
          <button
            type="button"
            className={`bird-dock-chat${badge ? " has-mail" : ""}${phase === "deliver" ? " is-drop-in" : ""}`}
            onClick={openChat}
            aria-label="Open chat"
          >
            <span className="bird-dock-chat-face" aria-hidden>
              💬
            </span>
            {badge > 0 ? <i>{badge > 9 ? "9+" : badge}</i> : null}
          </button>
        ) : null}
      </div>
    </div>
  );

  return inline || !mounted ? dock : createPortal(dock, document.body);
}
