"use client";

import { useState } from "react";
import { toggleShortlist } from "@/app/app/profiles/actions";
import { SafetyProfileControl } from "@/app/app/safety/safety-profile-control";
import { BirdDock, type PeekChatNote } from "@/app/browse/bird-dock";
import type { InterestThread } from "@/lib/match/interest-status";

type DetailGroup = { icon: string; title: string; items: { k: string; v: string }[] };
type HopeItem = { k: string; v: string };

export type ProfileData = {
  id: string;
  name: string;
  surname?: string;
  age: number | null;
  place: string;
  lastSeen: string | null;
  photos: Array<{ storage_path: string }>;
  photoUrl: string | null;
  photoUrls?: string[];
  videoUrls?: string[];
  voiceUrls?: string[];
  memberCode?: string;
  about?: string | null;
  details?: DetailGroup[];
  hope?: HopeItem[];
  kundali?: { total?: number; max?: number; label?: string } | null;
  shortlisted: boolean;
  own: boolean;
  user: unknown;
  interestId: string | null;
  thread: InterestThread;
  canSend: boolean;
  needPlan: boolean;
  needQuota: boolean;
  awaitingReview?: boolean;
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

export function ProfileRedesign(props: ProfileData) {
  const [open, setOpen] = useState({ details: true, hope: true, media: false });
  const [shortlistMsg, setShortlistMsg] = useState<string | null>(null);
  const [hero, setHero] = useState(0);
  const photos = props.photoUrls?.length ? props.photoUrls : props.photoUrl ? [props.photoUrl] : [];
  const chatUnlocked = props.thread === "sent" || props.thread === "received" || props.thread === "accepted";

  async function handleShortlist(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setShortlistMsg(props.shortlisted ? "Removing…" : "Adding…");
    try {
      await toggleShortlist(new FormData(e.currentTarget));
      setShortlistMsg(props.shortlisted ? "Removed from shortlist" : "Added to shortlist");
      setTimeout(() => setShortlistMsg(null), 2800);
    } catch {
      setShortlistMsg("Could not update shortlist");
      setTimeout(() => setShortlistMsg(null), 2800);
    }
  }

  return (
    <div className="pv-shell">
      {shortlistMsg ? <div className="pv-toast">{shortlistMsg}</div> : null}

      <header className="pv-hero">
        <div className="pv-photo-stack">
          {photos.length ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photos[hero] ?? photos[0]} alt={props.name} className="pv-photo" />
          ) : (
            <div className="pv-photo is-blank">{props.name.slice(0, 1)}</div>
          )}
          {photos.length > 1 ? (
            <div className="pv-thumbs">
              {photos.map((src, i) => (
                <button
                  key={src + i}
                  type="button"
                  className={`pv-thumb${hero === i ? " is-on" : ""}`}
                  onClick={() => setHero(i)}
                  aria-label={`Photo ${i + 1}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" />
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div className="pv-intro">
          <p className="pv-kicker">{props.memberCode ? `ID ${props.memberCode}` : "Member"}</p>
          <h1>{props.name}{props.surname ? ` ${props.surname}` : ""}</h1>
          <p className="pv-meta">
            {[props.age ? `${props.age} yrs` : null, props.place || null].filter(Boolean).join(" · ")}
          </p>
          {props.lastSeen ? <p className="pv-live">{props.lastSeen}</p> : null}
          {props.about ? <p className="pv-bio">{props.about}</p> : null}
          {props.kundali?.total != null ? (
            <p className="pv-match-chip">
              Kundali {props.kundali.total}/{props.kundali.max ?? 36}
              {props.kundali.label ? ` · ${props.kundali.label}` : ""}
            </p>
          ) : null}
        </div>
      </header>

      <section className="pv-panel">
        <button type="button" className="pv-panel-head" onClick={() => setOpen((s) => ({ ...s, details: !s.details }))}>
          <span className="pv-ico">▣</span>
          <span>Profile details</span>
          <b>{open.details ? "–" : "+"}</b>
        </button>
        {open.details && props.details?.length ? (
          <div className="pv-grid">
            {props.details.map((group) => (
              <article key={group.title} className="pv-tile">
                <h2>
                  <i>{group.icon}</i>
                  {group.title}
                </h2>
                <ul>
                  {group.items.map((item) => (
                    <li key={item.k}>
                      <span>{item.k}</span>
                      <strong>{item.v}</strong>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        ) : null}
      </section>

      <section className="pv-panel">
        <button type="button" className="pv-panel-head" onClick={() => setOpen((s) => ({ ...s, hope: !s.hope }))}>
          <span className="pv-ico">♡</span>
          <span>Looking for</span>
          <b>{open.hope ? "–" : "+"}</b>
        </button>
        {open.hope && props.hope?.length ? (
          <div className="pv-hope">
            {props.hope.map((item) => (
              <div key={item.k} className="pv-chip">
                <span>{item.k}</span>
                <strong>{item.v}</strong>
              </div>
            ))}
          </div>
        ) : null}
      </section>

      {(photos.length > 1 || props.videoUrls?.length || props.voiceUrls?.length) ? (
        <section className="pv-panel">
          <button type="button" className="pv-panel-head" onClick={() => setOpen((s) => ({ ...s, media: !s.media }))}>
            <span className="pv-ico">▶</span>
            <span>Photos, video & voice</span>
            <b>{open.media ? "–" : "+"}</b>
          </button>
          {open.media ? (
            <div className="pv-media">
              {props.videoUrls?.map((src, i) => (
                <video key={src} className="pv-video" controls src={src} aria-label={`Video ${i + 1}`} />
              ))}
              {props.voiceUrls?.map((src, i) => (
                <audio key={src} className="pv-audio" controls src={src} aria-label={`Voice ${i + 1}`} />
              ))}
            </div>
          ) : null}
        </section>
      ) : null}

      {!props.own && props.user ? (
        <section className="pv-actions">
          <form action={toggleShortlist} onSubmit={handleShortlist}>
            <input type="hidden" name="profile_id" value={props.id} />
            <input type="hidden" name="return_to" value={`/browse/${props.id}`} />
            <button type="submit" className={`pv-short${props.shortlisted ? " is-on" : ""}`}>
              {props.shortlisted ? "♥ Shortlisted" : "♡ Shortlist"}
            </button>
          </form>
          <SafetyProfileControl profileId={props.id} returnTo={`/browse/${props.id}`} name={props.name} />
        </section>
      ) : null}

      <section className={`pv-chat${chatUnlocked ? " is-open" : " is-locked"}`}>
        <div className="pv-chat-head">
          <span className="pv-ico">✉</span>
          <div>
            <h3>Chat</h3>
            <p>{chatUnlocked ? "You can write after a request is sent." : "Chat stays locked until you send a request."}</p>
          </div>
        </div>
      </section>

      {!props.own && props.user ? (
        <BirdDock
          profileId={props.id}
          interestId={props.interestId}
          thread={props.thread}
          canSend={props.canSend}
          needPlan={props.needPlan}
          needQuota={props.needQuota}
          awaitingReview={props.awaitingReview}
          quotaLeft={props.quotaLeft}
          finishHref={props.finishHref}
          chat={props.chat}
        />
      ) : null}
    </div>
  );
}
