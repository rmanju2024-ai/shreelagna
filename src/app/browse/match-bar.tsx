import { cancelInterest, sendInterest } from "@/app/app/profiles/actions";
import type { KundaliScore } from "@/lib/match/kundali";
import type { InterestThread } from "@/lib/match/interest-status";
import Link from "next/link";

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

  return (
    <aside className={`match-side is-${tone}`}>
      <p className="match-side-kicker">Compared with you</p>
      <p className="match-side-total">
        {kundali ? (
          <>
            Kundali {kundali.total}/{kundali.max}
            <span>{kundali.label}</span>
          </>
        ) : (
          <>
            Kundali —
            <span>Add stars to compare</span>
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
      {thread === "none" && canSend ? (
        <form action={sendInterest}>
          <input type="hidden" name="to_profile_id" value={profileId} />
          <button type="submit">Send interest{quotaLeft !== null ? ` · ${quotaLeft} left` : ""}</button>
        </form>
      ) : null}
      {thread === "none" && needPlan ? (
        <Link href="/app/plans" className="match-side-link">
          Choose a plan
        </Link>
      ) : null}
      {thread === "none" && needQuota ? (
        <Link href="/app/plans" className="match-side-link">
          Limit reached
        </Link>
      ) : null}
      {thread === "none" && !canSend && !needPlan && !needQuota ? (
        <Link href={finishHref} className="match-side-link">
          Finish profile
        </Link>
      ) : null}
      {thread === "sent" ? (
        <>
          <p className="match-side-status">Interest sent, awaiting approval</p>
          {interestId ? (
            <form action={cancelInterest}>
              <input type="hidden" name="to_profile_id" value={profileId} />
              <input type="hidden" name="interest_id" value={interestId} />
              <button type="submit" className="is-cancel">
                Cancel interest
              </button>
            </form>
          ) : null}
        </>
      ) : null}
      {thread === "received" ? (
        <Link href="/app/interests" className="match-side-link">
          Reply in inbox
        </Link>
      ) : null}
      {thread === "accepted" ? (
        <Link href="/app/chat" className="match-side-link">
          Open chat
        </Link>
      ) : null}
      {thread === "closed" && canSend ? (
        <form action={sendInterest}>
          <input type="hidden" name="to_profile_id" value={profileId} />
          <button type="submit">Send interest</button>
        </form>
      ) : null}
      {thread === "closed" && !canSend ? <p className="match-side-status">Interest closed</p> : null}
    </aside>
  );
}
