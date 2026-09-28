import { cancelInterest, sendInterest } from "@/app/app/profiles/actions";
import type { KundaliScore } from "@/lib/match/kundali";
import type { InterestThread } from "@/lib/match/interest-status";
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
  if (thread === "sent") {
    return {
      chirp: "They're thinking. You already sparked it.",
      cta: "Whisper in chat",
    };
  }
  if (thread === "received") {
    return {
      chirp: "They blinked first. Don't freeze.",
      cta: "Reply now",
    };
  }
  if (thread === "accepted") {
    return {
      chirp: "Green light. Hearts are waiting.",
      cta: "Say it in chat",
    };
  }
  if (thread === "closed") {
    return {
      chirp: "Fresh start. Stars still like this.",
      cta: "Spark interest",
    };
  }
  return {
    chirp: "Cute profile. Don't just look.",
    cta: "Spark interest",
  };
}

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
}) {
  const tone = !kundali ? "empty" : kundali.total >= 24 ? "good" : kundali.total >= 18 ? "mid" : "care";
  const lure = lureCopy(thread);
  const sent = thread === "sent";
  const chatHref = thread === "accepted" || thread === "sent" ? "/app/chat" : "/app/interests";

  return (
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
        {sent && interestId ? (
          <form action={cancelInterest}>
            <input type="hidden" name="to_profile_id" value={profileId} />
            <input type="hidden" name="interest_id" value={interestId} />
            <button type="submit" className="is-cancel">
              Pull interest
            </button>
          </form>
        ) : null}
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
      {thread === "sent" ? (
        <Link href={chatHref} className="match-side-link">
          {lure.cta}
        </Link>
      ) : null}
      {thread === "received" ? (
        <Link href="/app/interests" className="match-side-link">
          {lure.cta}
        </Link>
      ) : null}
      {thread === "accepted" ? (
        <Link href="/app/chat" className="match-side-link">
          {lure.cta}
        </Link>
      ) : null}
      {thread === "closed" && canSend ? (
        <form action={sendInterest}>
          <input type="hidden" name="to_profile_id" value={profileId} />
          <button type="submit">{lure.cta}</button>
        </form>
      ) : null}
    </aside>
  );
}
