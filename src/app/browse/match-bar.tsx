import { cancelInterest, sendInterest } from "@/app/app/profiles/actions";
import type { KundaliScore } from "@/lib/match/kundali";
import type { InterestThread } from "@/lib/match/interest-status";
import Link from "next/link";

function interestStatusLine({
  thread,
  canSend,
  needPlan,
  needQuota,
}: {
  thread: InterestThread;
  canSend: boolean;
  needPlan: boolean;
  needQuota: boolean;
}) {
  if (thread === "sent") return "Interest sent, awaiting approval";
  if (thread === "received") return "They sent interest";
  if (thread === "accepted") return "Interest accepted";
  if (thread === "closed") return "Interest closed";
  if (needPlan) return "Plan needed to send interest";
  if (needQuota) return "Interest limit reached";
  if (canSend) return "No interest yet";
  return "Finish profile to send interest";
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
  const status = interestStatusLine({ thread, canSend, needPlan, needQuota });

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
      <p className="match-side-status">{status}</p>
      <details className="match-side-more">
        <summary>Details</summary>
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
        {thread === "sent" && interestId ? (
          <form action={cancelInterest}>
            <input type="hidden" name="to_profile_id" value={profileId} />
            <input type="hidden" name="interest_id" value={interestId} />
            <button type="submit" className="is-cancel">
              Cancel interest
            </button>
          </form>
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
      </details>
    </aside>
  );
}
