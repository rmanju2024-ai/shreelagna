"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toggleShortlist, viewContact } from "@/app/app/profiles/actions";
import { SafetyProfileControl } from "@/app/app/safety/safety-profile-control";
import { BirdDock, type PeekChatNote } from "@/app/browse/bird-dock";
import type { InterestThread } from "@/lib/match/interest-status";

type DetailGroup = {
  icon: string;
  title: string;
  wide?: boolean;
  lead?: { text: string; caption: string };
  lines?: string[];
  items?: { k: string; v: string }[];
  note?: string | null;
};
type HopeItem = { k: string; v: string };

const FACT_ICON: Record<string, string> = {
  "Marital status": "💍",
  Diet: "🍃",
  "Blood group": "🩸",
  Disability: "♿",
  Health: "❤",
  Hobbies: "♫",
  "Sub-community": "◎",
  Gothra: "ॐ",
  Kuladevata: "🪔",
  "Living arrangement": "⌂",
  Citizenship: "🌐",
  "Pin code": "📍",
  "Employed in": "🏢",
  Income: "₹",
  "Settle abroad": "✈",
  Ambition: "★",
  "Living standard": "⌂",
  Rashi: "☽",
  Lagna: "☉",
  Nakshatra: "✦",
  "Nakshatra pada": "✧",
  Gana: "☯",
  Yoni: "❀",
  Mangalik: "🔥",
};

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
  familyAbout?: string | null;
  details?: DetailGroup[];
  matches?: string[];
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
  quotaUsed?: number;
  quotaLimit?: number | null;
  contact?: {
    revealed: boolean;
    mobile: string;
    email: string;
    locked: boolean;
    accepted: boolean;
    needPlan: boolean;
    canReveal: boolean;
    used: number;
    left: number | null;
    limit: number | null;
  };
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

function RichLine({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <p>
      {parts.map((part, i) =>
        part.startsWith("**") && part.endsWith("**") ? (
          <strong key={i} className="pv-mark">
            {part.slice(2, -2)}
          </strong>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </p>
  );
}

function ContactPanel({
  profileId,
  contact,
}: {
  profileId: string;
  contact: NonNullable<ProfileData["contact"]>;
}) {
  const [ask, setAsk] = useState(false);
  const quotaLine =
    contact.limit != null
      ? `Used ${contact.used} of ${contact.limit} · ${contact.left ?? 0} left`
      : "No monthly cap on this plan";
  return (
    <section className="pv-contact">
      <p className="pv-contact-title">Mobile & email</p>
      <p className="pv-contact-quota">{quotaLine}</p>
      {contact.revealed ? (
        <ul>
          <li>
            <span>Mobile</span>
            <strong>{contact.mobile || "Not on file"}</strong>
          </li>
          <li>
            <span>Email</span>
            <strong>{contact.email || "Not on file"}</strong>
          </li>
        </ul>
      ) : contact.locked ? (
        <p className="pv-contact-note">They keep mobile and email private.</p>
      ) : !contact.accepted ? (
        <p className="pv-contact-note">Contact opens after both families accept the request.</p>
      ) : contact.needPlan ? (
        <p className="pv-contact-note">
          A live plan is needed to view contact. <Link href="/app/plans">See plans</Link>
        </p>
      ) : contact.canReveal ? (
        ask ? (
          <form action={viewContact} className="pv-contact-ask">
            <input type="hidden" name="to_profile_id" value={profileId} />
            <p>This uses one contact view from your plan. Show mobile and email now?</p>
            <button type="submit">Yes, show contact</button>
            <button type="button" onClick={() => setAsk(false)}>
              Not now
            </button>
          </form>
        ) : (
          <button type="button" className="pv-contact-open" onClick={() => setAsk(true)}>
            Show contact
          </button>
        )
      ) : (
        <p className="pv-contact-note">
          No contact views left this period. <Link href="/app/plans">See plans</Link>
        </p>
      )}
    </section>
  );
}

function PlanLock({ on, children }: { on: boolean; children: React.ReactNode }) {
  if (!on) return children;
  return (
    <div className="pv-lock">
      <div className="pv-lock-body">{children}</div>
      <div className="pv-lock-veil">
        <p>A live plan unlocks the full profile, extra photos, video and voice.</p>
        <Link href="/app/plans">See plans</Link>
      </div>
    </div>
  );
}

export function ProfileRedesign(props: ProfileData) {
  const [shortlistMsg, setShortlistMsg] = useState<string | null>(null);
  const [hero, setHero] = useState(0);
  const [lightbox, setLightbox] = useState<number | null>(null);
  const photos = props.photoUrls?.length ? props.photoUrls : props.photoUrl ? [props.photoUrl] : [];
  const visiblePhotos = props.needPlan ? photos.slice(0, 1) : photos;
  const locked = Boolean(props.needPlan && !props.own);
  const spark = !props.own && props.user ? (
    <BirdDock
      inline
      profileId={props.id}
      interestId={props.interestId}
      thread={props.thread}
      canSend={props.canSend}
      needPlan={props.needPlan}
      needQuota={props.needQuota}
      awaitingReview={props.awaitingReview}
      quotaLeft={props.quotaLeft}
      finishHref={props.finishHref}
      chat={lightbox === null ? props.chat : undefined}
    />
  ) : null;

  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get("safety");
    if (code === "shortlisted") setShortlistMsg("Added to shortlist");
    if (code === "unshortlisted") setShortlistMsg("Removed from shortlist");
    if (code === "shortlist_error") setShortlistMsg("Could not update shortlist");
    if (code) window.setTimeout(() => setShortlistMsg(null), 2800);
  }, []);

  useEffect(() => {
    if (lightbox === null) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setLightbox(null);
      if (event.key === "ArrowRight") setLightbox((i) => (i == null ? i : (i + 1) % visiblePhotos.length));
      if (event.key === "ArrowLeft") setLightbox((i) => (i == null ? i : (i - 1 + visiblePhotos.length) % visiblePhotos.length));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox, visiblePhotos.length]);

  return (
    <div className="pv-shell">
      {shortlistMsg ? <div className="pv-toast">{shortlistMsg}</div> : null}

      <header className="pv-hero">
        <div className="pv-intro">
          <p className="pv-kicker">{props.memberCode ? `ID ${props.memberCode}` : "Member"}</p>
          <h1>
            {props.name}
            {props.surname ? ` ${props.surname}` : ""}
          </h1>
          <p className="pv-meta">
            <span>
              {[props.age ? `${props.age} yrs` : null, props.place || null].filter(Boolean).join(" · ")}
            </span>
            {props.lastSeen ? <span className="pv-live">{props.lastSeen}</span> : null}
          </p>
          {props.kundali?.total != null ? (
            <p className="pv-match-chip">
              Kundali {props.kundali.total}/{props.kundali.max ?? 36}
              {props.kundali.label ? ` · ${props.kundali.label}` : ""}
            </p>
          ) : null}
        </div>
        {!props.own && props.user ? (
          <div className="pv-top-actions">
            <form action={toggleShortlist}>
              <input type="hidden" name="profile_id" value={props.id} />
              <input type="hidden" name="return_to" value={`/browse/${props.id}`} />
              <button
                type="submit"
                className={`pv-ico-btn pv-short${props.shortlisted ? " is-on" : ""}`}
                aria-label={props.shortlisted ? "Shortlisted" : "Shortlist"}
                title={props.shortlisted ? "Shortlisted" : "Shortlist"}
                data-tip={props.shortlisted ? "Shortlisted" : "Shortlist"}
              >
                {props.shortlisted ? "♥" : "♡"}
              </button>
            </form>
            <SafetyProfileControl icons profileId={props.id} returnTo={`/browse/${props.id}`} name={props.name} />
          </div>
        ) : null}
      </header>

      {props.matches?.length ? (
        <div className="pv-match-banner" aria-label="Matching points">
          <span className="pv-match-kicker">Why this fits</span>
          <div className="pv-match-mask">
            <div className="pv-match-track">
              {[...props.matches, ...props.matches].map((item, i) => (
                <span key={`${item}-${i}`} className="pv-match-pill">
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      <div className="pv-layout">
        <div className="pv-main">
          {props.details?.length ? (
            <PlanLock on={locked}>
              <section className="pv-panel">
                <div className="pv-panel-head">
                  <span className="pv-ico">▣</span>
                  <span>Profile details</span>
                </div>
                <div className="pv-grid">
                  {props.details.map((group) => (
                    <article key={group.title} className={`pv-tile${group.wide ? " is-wide" : ""}`}>
                      <h2>
                        <i>{group.icon}</i>
                        {group.title}
                      </h2>
                      {group.lead ? (
                        <p className="pv-lead">
                          <strong>{group.lead.text}</strong>
                          <span>{group.lead.caption}</span>
                        </p>
                      ) : null}
                      {group.lines?.length ? (
                        <div className="pv-lines">
                          {group.lines.map((text) => (
                            <RichLine key={text} text={text} />
                          ))}
                        </div>
                      ) : null}
                      {group.items?.length ? (
                        <ul>
                          {group.items.map((item) => (
                            <li key={item.k}>
                              <b className="pv-fact-ico" aria-hidden>
                                {FACT_ICON[item.k] ?? "•"}
                              </b>
                              <span>{item.k}</span>
                              <strong>{item.v}</strong>
                            </li>
                          ))}
                        </ul>
                      ) : null}
                      {group.note ? <p className="pv-note">{group.note}</p> : null}
                    </article>
                  ))}
                </div>
              </section>
            </PlanLock>
          ) : null}

          {props.hope?.length ? (
            <section className="pv-panel">
              <div className="pv-panel-head">
                <span className="pv-ico">♡</span>
                <span>Looking for</span>
              </div>
              <div className="pv-hope">
                {props.hope.map((item) => (
                  <div key={item.k} className="pv-chip">
                    <span>{item.k}</span>
                    <strong>{item.v}</strong>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          <section className={`pv-chat${props.thread === "none" ? " is-locked" : " is-open"}`}>
            <div className="pv-chat-head">
              <span className="pv-ico">✉</span>
              <div>
                <h3>Chat</h3>
                <p>
                  {props.thread === "none"
                    ? "Send a request under the photo. Chat stays closed until the family accepts."
                    : props.thread === "sent"
                      ? "Your request is sent. Chat opens when they accept."
                      : props.thread === "received"
                        ? "They sent you a request. Reply from Interests to open chat."
                        : "You are connected. Use chat under the photo to write."}
                </p>
              </div>
            </div>
          </section>
        </div>

        <aside className="pv-media-col">
          <p className="pv-media-title">Photos, video & voice</p>
          {visiblePhotos.length ? (
            <button type="button" className="pv-media-hero" onClick={() => setLightbox(hero)} aria-label="Enlarge photo">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={visiblePhotos[hero] ?? visiblePhotos[0]} alt={props.name} />
              <span>View larger</span>
            </button>
          ) : (
            <div className="pv-media-hero is-blank">{props.name.slice(0, 1)}</div>
          )}
          {lightbox === null ? <div className="pv-spark-box">{spark}</div> : null}
          {props.contact ? <ContactPanel profileId={props.id} contact={props.contact} /> : null}
          {visiblePhotos.length > 1 ? (
            <div className="pv-thumbs">
              {visiblePhotos.map((src, i) => (
                <button
                  key={src + i}
                  type="button"
                  className={`pv-thumb${hero === i ? " is-on" : ""}`}
                  onClick={() => setHero(i)}
                  onDoubleClick={() => setLightbox(i)}
                  aria-label={`Photo ${i + 1}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" />
                </button>
              ))}
            </div>
          ) : null}
          <PlanLock on={locked}>
            <>
              {props.videoUrls?.map((src, i) => (
                <video key={src} className="pv-video" controls src={src} aria-label={`Video ${i + 1}`} />
              ))}
              {props.voiceUrls?.map((src, i) => (
                <audio key={src} className="pv-audio" controls src={src} aria-label={`Voice ${i + 1}`} />
              ))}
            </>
          </PlanLock>
          {!visiblePhotos.length && !props.videoUrls?.length && !props.voiceUrls?.length ? (
            <p className="pv-media-empty">No photo, video or voice yet.</p>
          ) : null}
        </aside>
      </div>

      {lightbox !== null && visiblePhotos[lightbox] ? (
        <div className="pv-lightbox" role="dialog" aria-label="Enlarged photo">
          <button
            type="button"
            className="pv-lightbox-nav"
            onClick={() => setLightbox((i) => (i == null ? 0 : (i - 1 + visiblePhotos.length) % visiblePhotos.length))}
            aria-label="Previous photo"
          >
            ‹
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={visiblePhotos[lightbox]} alt={`${props.name} photo ${lightbox + 1}`} />
          <button
            type="button"
            className="pv-lightbox-nav"
            onClick={() => setLightbox((i) => (i == null ? 0 : (i + 1) % visiblePhotos.length))}
            aria-label="Next photo"
          >
            ›
          </button>
          <button type="button" className="pv-lightbox-close" onClick={() => setLightbox(null)} aria-label="Close">
            Close
          </button>
          <div className="pv-lightbox-spark" onClick={(e) => e.stopPropagation()}>
            {spark}
          </div>
        </div>
      ) : null}
    </div>
  );
}
