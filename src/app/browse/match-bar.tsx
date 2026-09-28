import { cancelInterest, sendInterest } from "@/app/app/profiles/actions";
import { sendChat } from "@/app/app/match/actions";
import type { KundaliScore } from "@/lib/match/kundali";
import type { InterestThread } from "@/lib/match/interest-status";
import { chatStamp } from "@/lib/match/chat-ui";
import Link from "next/link";

function MatchBird() {
  return (
    <svg className="match-bird-svg" viewBox="0 0 72 48" aria-hidden>
      <g className="match-bird-body">
        <ellipse cx="34" cy="28" rx="16" ry="10" fill="#fde68a" />
        <ellipse cx="38" cy="26" rx="12" ry="8" fill="#f59e0b" />
        <circle cx="52" cy="20" r="7.2" fill="#fbbf24" />
        <circle cx="54.5" cy="18.5" r="1.6" fill="#1f2937" />
        <path d="M58 21 L66 23 L58 25 Z" fill="#ea580c" />
        <g className="match-bird-wing">
          <path d="M28 24 C12 8 8 22 24 30 C18 22 24 16 28 24 Z" fill="#fdba74" />
        </g>
        <path d="M18 30 C12 34 10 40 16 38 C22 36 22 32 18 30 Z" fill="#fb923c" />
        <path d="M48 36 L50 44 L46 42 Z" fill="#b45309" />
        <path d="M42 36 L43 44 L39 41 Z" fill="#b45309" />
      </g>
    </svg>
  );
}

function lureCopy(thread: InterestThread) {
  if (thread === "sent") return { chirp: "They're thinking. You already sparked it.", cta: "Spark interest" };
  if (thread === "received") return { chirp: "They blinked first. Don't freeze.", cta: "Reply now" };
  if (thread === "accepted") return { chirp: "Green light. Hearts are waiting.", cta: "Spark interest" };
  if (thread === "closed") return { chirp: "Fresh start. Stars still like this.", cta: "Spark interest" };
  return { chirp: "Cute profile. Don't just look.", cta: "Spark interest" };
}

export type PeekChatNote = {
  id: string;
  sender_profile_id: string;
  body: string;
  created_at: string;
};

export function MatchBar({
  profileId,
  interestId,
  finishHref,
  thread,
  canSend,
  needPlan,
  needQuota,
  quotaLeft,
  kundali,
  chat,
}: {
  profileId: string;
  interestId: string | null;
  finishHref: string;
  thread: InterestThread;
  canSend: boolean;
  needPlan: boolean;
  needQuota: boolean;
  quotaLeft: number | null;
  kundali: KundaliScore | null;
  chat?: {
    myProfileId: string | null;
    threadId: string | null;
    notes: PeekChatNote[];
    live: boolean;
  };
}) {
  const tone = !kundali ? "empty" : kundali.total >= 24 ? "good" : kundali.total >= 18 ? "mid" : "care";
  const lure = lureCopy(thread);
  const sent = thread === "sent";
  const showChat = thread === "sent" || thread === "received" || thread === "accepted";
  const returnTo = `/browse/${profileId}`;

  return (
    <div className="match-dock-stack">
      <aside className={`match-side match-lure is-${tone}`}>
        <details className="match-side-more">
          <summary>
            <span className="match-bird-sky" aria-hidden>
              <span className="match-bird-dot" />
              <span className="match-bird-dot is-2" />
              <MatchBird />
            </span>
            <span className="match-peek">Tap here. Peek kundali.</span>
          </summary>
          <div className="match-kundali-pop">
            <p className="match-side-total">
              {kundali ? (
                <>
                  Kundali {kundali.total}/{kundali.max}
                  <span>{kundali.label}</span>
                </>
              ) : (
                <>
                  Kundali —
                  <span>Add your stars</span>
                </>
              )}
            </p>
            <ol className="match-side-parts">
              {(kundali?.parts ?? [
                { k: "Gana", score: 0, max: 6 },
                { k: "Yoni", score: 0, max: 4 },
                { k: "Tara", score: 0, max: 3 },
                { k: "Rashi", score: 0, max: 7 },
                { k: "Mangalik", score: 0, max: 8 },
                { k: "Details", score: 0, max: 8 },
              ]).map((part) => (
                <li key={part.k}>
                  <span>{part.k}</span>
                  <b>
                    {part.score}/{part.max}
                  </b>
                </li>
              ))}
            </ol>
          </div>
        </details>
        <p className="match-chirp">{lure.chirp}</p>
        {thread === "none" && canSend ? (
          <form action={sendInterest}>
            <input type="hidden" name="to_profile_id" value={profileId} />
            <button type="submit">
              {lure.cta}
              {quotaLeft !== null ? ` · ${quotaLeft}` : ""}
            </button>
          </form>
        ) : null}
        {thread === "none" && needPlan ? (
          <Link href="/app/plans" className="match-side-link">
            Unlock & spark
          </Link>
        ) : null}
        {thread === "none" && needQuota ? (
          <Link href="/app/plans" className="match-side-link">
            More sparks
          </Link>
        ) : null}
        {thread === "none" && !canSend && !needPlan && !needQuota ? (
          <Link href={finishHref} className="match-side-link">
            Finish, then spark
          </Link>
        ) : null}
        {thread === "received" ? (
          <Link href="/app/interests" className="match-side-link">
            {lure.cta}
          </Link>
        ) : null}
        {thread === "closed" && canSend ? (
          <form action={sendInterest}>
            <input type="hidden" name="to_profile_id" value={profileId} />
            <button type="submit">{lure.cta}</button>
          </form>
        ) : null}
        {sent && interestId ? (
          <form action={cancelInterest}>
            <input type="hidden" name="to_profile_id" value={profileId} />
            <input type="hidden" name="interest_id" value={interestId} />
            <button type="submit" className="is-cancel">
              Drop Interest
            </button>
          </form>
        ) : null}
      </aside>
      {showChat ? (
        <section className="peek-chat" aria-label="Private chat">
          <p className="peek-chat-kicker">Private line</p>
          <ul className="peek-chat-stream">
            {(chat?.notes ?? []).length ? (
              (chat?.notes ?? []).map((note) => (
                <li
                  key={note.id}
                  className={`peek-chat-bubble ${note.sender_profile_id === chat?.myProfileId ? "is-mine" : "is-theirs"}`}
                >
                  <p>{note.body}</p>
                  <time>{chatStamp(note.created_at)}</time>
                </li>
              ))
            ) : (
              <li className="peek-chat-empty">Say hi. Keep it warm and short.</li>
            )}
          </ul>
          {chat?.live === false ? (
            <p className="peek-chat-lock">
              A live plan keeps this line open. <Link href="/app/plans">Open plans</Link>
            </p>
          ) : (
            <form action={sendChat} className="peek-chat-composer">
              {chat?.threadId ? <input type="hidden" name="thread_id" value={chat.threadId} /> : null}
              <input type="hidden" name="to_profile_id" value={profileId} />
              <input type="hidden" name="next" value={returnTo} />
              <textarea name="body" required maxLength={4000} rows={2} placeholder="Type a private note…" />
              <button type="submit">Send</button>
            </form>
          )}
        </section>
      ) : null}
    </div>
  );
}
