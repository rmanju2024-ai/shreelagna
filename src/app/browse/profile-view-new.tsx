"use client";

import { useState, useEffect } from "react";
import { toggleShortlist } from "@/app/app/profiles/actions";
import { SafetyProfileControl } from "@/app/app/safety/safety-profile-control";
import { BirdDock, type PeekChatNote } from "@/app/browse/bird-dock";
import { displayFirstName } from "@/lib/profile/options";
import type { KundaliScore } from "@/lib/match/kundali";
import type { InterestThread } from "@/lib/match/interest-status";
import Link from "next/link";

export type ProfileViewProps = {
  id: string;
  name: string;
  age: number | null;
  place: string;
  lastSeen: string | null;
  photos: { storage_path: string }[];
  photoUrl: string | null;
  memberCode?: string;
  about?: string | null;
  shortlisted: boolean;
  own: boolean;
  user: any;
  kundali: KundaliScore | null;
  interestId: string | null;
  thread: InterestThread;
  canSend: boolean;
  needPlan: boolean;
  needQuota: boolean;
  quotaLeft: number | null;
  chat?: {
    myProfileId: string | null;
    threadId: string | null;
    notes: PeekChatNote[];
    live: boolean;
    name: string;
    photo: string | null;
    seen: string | null;
  };
  finishHref: string;
};

export function ProfileViewNew({
  id,
  name,
  age,
  place,
  lastSeen,
  photos,
  photoUrl,
  memberCode,
  about,
  shortlisted,
  own,
  user,
  kundali,
  interestId,
  thread,
  canSend,
  needPlan,
  needQuota,
  quotaLeft,
  chat,
  finishHref,
}: ProfileViewProps) {
  const [shortlistMsg, setShortlistMsg] = useState<string | null>(null);

  async function handleShortlist(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setShortlistMsg(shortlisted ? "Removing from shortlist..." : "Adding to shortlist...");
    const formData = new FormData(e.currentTarget);
    try {
      await toggleShortlist(formData);
      setShortlistMsg(shortlisted ? "Removed from shortlist" : "Added to shortlist");
      setTimeout(() => setShortlistMsg(null), 3000);
    } catch {
      setShortlistMsg("Could not update shortlist");
      setTimeout(() => setShortlistMsg(null), 3000);
    }
  }

  return (
    <div className="pv-container">
      {/* Hero with photo gallery */}
      <section className="pv-hero">
        <div className="pv-gallery">
          {photos.length > 0 ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photoUrl ?? ""} alt={name} className="pv-main-photo" />
          ) : (
            <div className="pv-no-photo">
              <span>{name.slice(0, 1)}</span>
            </div>
          )}
          <div className="pv-gallery-dots">
            {photos.map((_, i) => (
              <span key={i} className={`pv-dot${i === 0 ? " is-active" : ""}`} aria-hidden />
            ))}
          </div>
        </div>
        <div className="pv-hero-info">
          <div>
            <h1>{name}</h1>
            {age || place ? (
              <p className="pv-subline">
                {age && `${age} years`}
                {age && place && " · "}
                {place}
              </p>
            ) : null}
            {lastSeen ? <p className="pv-online">● {lastSeen}</p> : null}
          </div>
        </div>
      </section>

      {/* Messages as toast/banner above content */}
      {shortlistMsg ? (
        <div className="pv-toast" role="status">
          {shortlistMsg}
        </div>
      ) : null}

      {/* Key info grid */}
      <section className="pv-snapshot">
        {about ? (
          <div className="pv-about">
            <p>{about}</p>
          </div>
        ) : null}
        <div className="pv-grid">
          {kundali && (
            <div className="pv-card">
              <small>Kundali match</small>
              <strong>{kundali.total}/{kundali.max}</strong>
            </div>
          )}
          {memberCode && (
            <div className="pv-card">
              <small>Member ID</small>
              <strong>{memberCode}</strong>
            </div>
          )}
        </div>
      </section>

      {/* Actions bar: Shortlist + Safety */}
      {!own && user ? (
        <section className="pv-actions">
          <form action={toggleShortlist} onSubmit={handleShortlist} className="pv-shortlist-form">
            <input type="hidden" name="profile_id" value={id} />
            <input type="hidden" name="return_to" value={`/browse/${id}`} />
            <button type="submit" className={`pv-btn-shortlist${shortlisted ? " is-on" : ""}`}>
              {shortlisted ? "♥ Shortlisted" : "♡ Shortlist"}
            </button>
          </form>
          <SafetyProfileControl profileId={id} returnTo={`/browse/${id}`} name={name} />
        </section>
      ) : null}

      {/* Main action: Send interest / Chat bird */}
      {!own && user ? (
        <BirdDock
          profileId={id}
          interestId={interestId}
          thread={thread}
          canSend={canSend}
          needPlan={needPlan}
          needQuota={needQuota}
          quotaLeft={quotaLeft}
          finishHref={finishHref}
          chat={chat}
        />
      ) : null}
    </div>
  );
}
