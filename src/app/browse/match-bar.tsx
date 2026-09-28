import { BirdDock, type PeekChatNote } from "@/app/browse/bird-dock";
import type { KundaliScore } from "@/lib/match/kundali";
import type { InterestThread } from "@/lib/match/interest-status";

export type { PeekChatNote } from "@/app/browse/bird-dock";

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
  return (
    <div className="match-dock-stack">
      <details className="match-side-more match-kundali-chip">
        <summary>Kundali {kundali ? `${kundali.total}/${kundali.max}` : "—"}</summary>
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
    </div>
  );
}
