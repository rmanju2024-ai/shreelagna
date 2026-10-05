"use client";

import { useState } from "react";
import { toggleShortlist } from "@/app/app/profiles/actions";
import { SafetyProfileControl } from "@/app/app/safety/safety-profile-control";
import { BirdDock } from "@/app/browse/bird-dock";

export type ProfileData = {
  id: string;
  name: string;
  surname?: string;
  age: number | null;
  place: string;
  lastSeen: string | null;
  photos: Array<{ storage_path: string }>;
  photoUrl: string | null;
  videos?: Array<{ storage_path: string }>;
  voices?: Array<{ storage_path: string }>;
  memberCode?: string;
  about?: string | null;
  details?: any;
  hope?: any;
  kundali?: any;
  shortlisted: boolean;
  own: boolean;
  user: any;
  interestId: string | null;
  thread: any;
  canSend: boolean;
  needPlan: boolean;
  needQuota: boolean;
  quotaLeft: number | null;
  chat?: any;
  finishHref: string;
};

type ExpandedCard = Record<string, boolean>;

export function ProfileRedesign(props: ProfileData) {
  const [expanded, setExpanded] = useState<ExpandedCard>({ about: true });
  const [shortlistMsg, setShortlistMsg] = useState<string | null>(null);

  async function handleShortlist(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setShortlistMsg(props.shortlisted ? "Removing..." : "Adding...");
    try {
      await toggleShortlist(new FormData(e.currentTarget));
      setShortlistMsg(props.shortlisted ? "Removed from shortlist" : "Added to shortlist");
      setTimeout(() => setShortlistMsg(null), 3000);
    } catch {
      setShortlistMsg("Error");
      setTimeout(() => setShortlistMsg(null), 3000);
    }
  }

  function toggleCard(cardId: string) {
    setExpanded((prev) => ({ ...prev, [cardId]: !prev[cardId] }));
  }

  return (
    <div className="pr3-container">
      {/* COMPACT Hero Section - Horizontal Layout */}
      <section className="pr3-hero">
        {props.photos.length > 0 ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={props.photoUrl || ""} alt={props.name} className="pr3-hero-img" />
        ) : (
          <div className="pr3-hero-blank">{props.name.slice(0, 1)}</div>
        )}
        <div className="pr3-hero-info">
          <h1>{props.name}</h1>
          {props.age || props.place ? (
            <p>
              {props.age && `${props.age}`}
              {props.age && props.place && " • "}
              {props.place}
            </p>
          ) : null}
          {props.about && <p className="pr3-about">{props.about}</p>}
          {props.lastSeen ? <p className="pr3-online">🟢 {props.lastSeen}</p> : null}
        </div>
      </section>

      {/* Toast */}
      {shortlistMsg ? <div className="pr3-toast">{shortlistMsg}</div> : null}

      {/* COMPACT Cards */}
      <section className="pr3-cards">
        {/* Details Card */}
        {props.details && props.details.length > 0 && (
          <div
            className={`pr3-card${expanded.details ? " is-expanded" : ""}`}
            onClick={() => toggleCard("details")}
          >
            <div className="pr3-card-head">
              <h2>ℹ️ Details</h2>
              <span className="pr3-toggle">{expanded.details ? "−" : "+"}</span>
            </div>
            {expanded.details && (
              <div className="pr3-card-body">
                {props.details.map((group: any, i: number) => (
                  <div key={i} className="pr3-group">
                    <h4>{group.title}</h4>
                    {group.items.map((item: any, j: number) => (
                      <div key={j} className="pr3-row">
                        <span className="pr3-label">{item.k}</span>
                        <span className="pr3-value">{item.v}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Preferences Card */}
        {props.hope && props.hope.length > 0 && (
          <div
            className={`pr3-card${expanded.hope ? " is-expanded" : ""}`}
            onClick={() => toggleCard("hope")}
          >
            <div className="pr3-card-head">
              <h2>💕 Looking For</h2>
              <span className="pr3-toggle">{expanded.hope ? "−" : "+"}</span>
            </div>
            {expanded.hope && (
              <div className="pr3-card-body">
                {props.hope.map((group: any, i: number) => (
                  <div key={i}>
                    {group.items.map((item: any, j: number) => (
                      <div key={j} className="pr3-row">
                        <span className="pr3-label">{item.k}</span>
                        <span className="pr3-value">{item.v}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Media Card */}
        {(props.photos.length > 1 || props.videos?.length || props.voices?.length) && (
          <div
            className={`pr3-card${expanded.media ? " is-expanded" : ""}`}
            onClick={() => toggleCard("media")}
          >
            <div className="pr3-card-head">
              <h2>📸 Media</h2>
              <span className="pr3-toggle">{expanded.media ? "−" : "+"}</span>
            </div>
            {expanded.media && (
              <div className="pr3-card-body pr3-media-body">
                {props.photos.length > 1 && (
                  <div className="pr3-media-section">
                    <div className="pr3-media-grid">
                      {props.photos.map((photo: any, i: number) => (
                        <img
                          key={i}
                          src={`${photo.storage_path}?w=60&h=60`}
                          alt={`Photo ${i + 1}`}
                          className="pr3-photo-thumb"
                        />
                      ))}
                    </div>
                  </div>
                )}
                {props.videos && props.videos.length > 0 && (
                  <div className="pr3-media-section">
                    {props.videos.map((video: any, i: number) => (
                      <a
                        key={i}
                        href={video.storage_path}
                        className="pr3-media-link"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        🎥 Video {i + 1}
                      </a>
                    ))}
                  </div>
                )}
                {props.voices && props.voices.length > 0 && (
                  <div className="pr3-media-section">
                    {props.voices.map((voice: any, i: number) => (
                      <audio key={i} controls className="pr3-audio">
                        <source src={voice.storage_path} type="audio/mpeg" />
                      </audio>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </section>

      {/* COMPACT Action Bar */}
      <section className="pr3-footer">
        <div className="pr3-actions">
          {!props.own && props.user ? (
            <>
              <form action={toggleShortlist} onSubmit={handleShortlist} className="pr3-form-inline">
                <input type="hidden" name="profile_id" value={props.id} />
                <input type="hidden" name="return_to" value={`/browse/${props.id}`} />
                <button type="submit" className={`pr3-btn-secondary${props.shortlisted ? " is-on" : ""}`}>
                  {props.shortlisted ? "♥ Shortlist" : "♡ Shortlist"}
                </button>
              </form>
              <SafetyProfileControl profileId={props.id} returnTo={`/browse/${props.id}`} name={props.name} />
            </>
          ) : null}
        </div>

        {/* Send Request Button */}
        <BirdDock
          profileId={props.id}
          interestId={props.interestId}
          thread={props.thread}
          canSend={props.canSend}
          needPlan={props.needPlan}
          needQuota={props.needQuota}
          quotaLeft={props.quotaLeft}
          finishHref={props.finishHref}
          chat={props.chat}
        />
      </section>

      {/* Chat Section - Disabled */}
      <section className="pr3-chat-section">
        <div className="pr3-chat-disabled">
          <h3>💬 Chat</h3>
          <p className="pr3-chat-hint">Send a request first to start chatting</p>
        </div>
      </section>
    </div>
  );
}
