"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { revealContact, saveShortlist } from "@/app/app/profiles/actions";
import { SafetyProfileControl } from "@/app/app/safety/safety-profile-control";
import { BirdDock, type PeekChatNote } from "@/app/browse/bird-dock";
import { CompletenessMeter } from "@/app/app/profiles/completeness-meter";
import { KindMark } from "@/components/kind-mark";
import { otherProfileLocked } from "@/lib/profile/view-gate";
import type { CompletenessItem } from "@/lib/profile/completeness";
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
type HopeItem = { k: string; v: string; fit?: boolean | null };

const FACT_ICON: Record<string, string> = {
  "Mother tongue": "🗣",
  "Languages known": "💬",
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
  "Wish to settle in abroad": "✈",
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
  profileType?: string | null;
  house?: "staff" | "admin";
  about?: string | null;
  familyAbout?: string | null;
  details?: DetailGroup[];
  matches?: string[];
  hope?: HopeItem[];
  fitScore?: { hit: number; total: number } | null;
  kundali?: { total?: number; max?: number; label?: string } | null;
  shortlisted: boolean;
  own: boolean;
  editHref?: string;
  user: unknown;
  interestId: string | null;
  thread: InterestThread;
  canSend: boolean;
  needPlan: boolean;
  needQuota: boolean;
  awaitingReview?: boolean;
  needComplete?: boolean;
  viewerReadyPct?: number;
  pendingEssentials?: number;
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
    counted: boolean;
    self?: boolean;
    canReveal: boolean;
    used: number;
    left: number | null;
    limit: number | null;
    needComplete?: boolean;
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
  readiness?: {
    mandatoryPct: number;
    overallPct: number;
    mandatoryFilled: number;
    mandatoryTotal: number;
    overallFilled: number;
    overallTotal: number;
    pendingMandatory: CompletenessItem[];
    pendingRecommended: CompletenessItem[];
  } | null;
  verify?: Array<{ id: string; label: string; on: boolean }>;
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

function CoupleMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 18" aria-hidden>
      <circle cx="7.2" cy="5.2" r="2.35" fill="currentColor" />
      <path d="M3.2 16.2 C3.2 11.8 5 9.6 7.2 9.6 C9.4 9.6 11.2 11.8 11.2 16.2 Z" fill="currentColor" />
      <circle cx="16.8" cy="5.2" r="2.35" fill="currentColor" />
      <path d="M12.8 16.2 C12.8 11.8 14.6 9.6 16.8 9.6 C19 9.6 20.8 11.8 20.8 16.2 Z" fill="currentColor" />
      <path
        d="M12 7.1 C12 5.7 13.15 5.15 13.85 5.85 C14.55 5.15 15.7 5.7 15.7 7.1 C15.7 8.55 13.85 10.15 12 11.1 C10.15 10.15 8.3 8.55 8.3 7.1 C8.3 5.7 9.45 5.15 10.15 5.85 C10.85 5.15 12 5.7 12 7.1 Z"
        fill="#fb7185"
      />
    </svg>
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
  const [busy, setBusy] = useState(false);
  const [fail, setFail] = useState<string | null>(null);
  const [shown, setShown] = useState<{ mobile: string; email: string } | null>(
    contact.revealed ? { mobile: contact.mobile, email: contact.email } : null,
  );
  const [quota, setQuota] = useState({ used: contact.used, left: contact.left, limit: contact.limit });
  const quotaLine =
    quota.limit != null ? `${quota.left ?? 0} of ${quota.limit} left` : "No cap on this plan";

  function onConfirm() {
    setAsk(false);
    setBusy(true);
    setFail(null);
    setShown({ mobile: "…", email: "…" });
    void revealContact(profileId).then((res) => {
      setBusy(false);
      if (!res.ok) {
        setShown(null);
        setAsk(true);
        setFail(
          res.error === "incomplete"
            ? "Fill every house essential on your biodata first."
            : "Could not show contact just now. Try again.",
        );
        return;
      }
      setShown({ mobile: res.mobile || "Not on file", email: res.email || "Not on file" });
      if (res.limit != null) setQuota({ used: res.used ?? quota.used, left: res.left ?? quota.left, limit: res.limit });
    });
  }

  return (
    <section className="pv-contact">
      <p className="pv-contact-title">{contact.self ? "Your mobile & email" : "Mobile & email"}</p>
      {contact.self ? null : (
        <p className="pv-contact-quota">{quotaLine}. One family, one count.</p>
      )}
      {shown ? (
        <>
          <ul>
            <li>
              <span>Mobile</span>
              <strong>{shown.mobile || "Not on file"}</strong>
            </li>
            <li>
              <span>Email</span>
              <strong>{shown.email || "Not on file"}</strong>
            </li>
          </ul>
        </>
      ) : contact.locked ? (
        <p className="pv-contact-note">They keep mobile and email private.</p>
      ) : contact.needPlan ? (
        <p className="pv-contact-note">
          A live plan is needed to view contact. <Link href="/app/plans">See plans</Link>
        </p>
      ) : contact.needComplete ? (
        <p className="pv-contact-note">
          Complete your biodata first. Then this family's mobile and email can be shown.{" "}
          <Link href="/app/account">Complete my profile</Link>
        </p>
      ) : contact.canReveal ? (
        ask ? (
          <div className="pv-contact-ask">
            <p>
              {contact.counted
                ? "This profile is already on your count. Showing contact will not use another."
                : `Showing mobile and email uses 1 for this profile. A send request here will not use another. ${
                    quota.limit != null ? `You will have ${Math.max(0, (quota.left ?? 1) - 1)} left.` : ""
                  }`}
            </p>
            {fail ? <p className="pv-contact-note">{fail}</p> : null}
            <button type="button" onClick={onConfirm} disabled={busy}>
              Yes, show contact
            </button>
            <button type="button" onClick={() => setAsk(false)}>
              Not now
            </button>
          </div>
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

function DetailTiles({ groups }: { groups: DetailGroup[] }) {
  return (
    <div className="pv-grid">
      {groups.map((group) => (
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
  );
}

function PlanLock({
  on,
  href,
  cta,
  children,
  message,
}: {
  on: boolean;
  href: string;
  cta: string;
  message: string;
  children: React.ReactNode;
}) {
  if (!on) return children;
  return (
    <div className="pv-lock">
      <div className="pv-lock-body">{children}</div>
      <div className="pv-lock-veil">
        <p>{message}</p>
        <Link href={href}>{cta}</Link>
      </div>
    </div>
  );
}

function ReadyBanner({
  needComplete,
  needPlan,
  pct,
  pending,
  finishHref,
}: {
  needComplete: boolean;
  needPlan: boolean;
  pct: number;
  pending: number;
  finishHref: string;
}) {
  const left = Math.max(0, pending);
  const both = needComplete && needPlan;
  const kicker = both ? "Profile and plan open this house" : needComplete ? "Your biodata opens this house" : "A live plan opens this house";
  const title = both
    ? "Complete your must-haves and keep a live plan to unlock education, family, kundali and contact."
    : needComplete
      ? "Finish your must-haves to unlock education, family, kundali and contact."
      : "Start a live plan to unlock education, family, kundali, extra photos and contact.";
  const body = both
    ? `Must-have is at ${pct}%, with ${left} house ${left === 1 ? "essential" : "essentials"} still open, and there is no live plan on this account yet. Finish both, then this family's full story opens.`
    : needComplete
      ? pct > 0
        ? `Must-have is at ${pct}%. ${
            left === 0
              ? "A little polish still waits, then the full story opens."
              : `${left} house ${left === 1 ? "essential still waits" : "essentials still wait"} for your hand.`
          }`
        : "Complete your own profile first. Then this family's details, extra photos, and contact will open."
      : "A live plan keeps the house open: full details, extra photos, video, voice, requests and contact.";
  return (
    <aside className="pv-ready-banner" role="status">
      <p className="pv-ready-kicker">{kicker}</p>
      <h2>{title}</h2>
      <p>{body}</p>
      <div className="pv-ready-actions">
        {needComplete ? <Link href={finishHref}>Complete my profile</Link> : null}
        {needPlan ? (
          <Link href="/app/plans" className={needComplete ? "is-soft" : undefined}>
            See plans
          </Link>
        ) : null}
      </div>
    </aside>
  );
}

export function ProfileRedesign(props: ProfileData) {
  const [shortlistMsg, setShortlistMsg] = useState<string | null>(null);
  const [listed, setListed] = useState(props.shortlisted);
  const [mounted, setMounted] = useState(false);
  const shortlistGen = useRef(0);
  const toastTimer = useRef(0);
  const [hero, setHero] = useState(0);
  const [lightbox, setLightbox] = useState<number | null>(null);
  const photos = props.photoUrls?.length ? props.photoUrls : props.photoUrl ? [props.photoUrl] : [];
  const gate = otherProfileLocked({
    own: props.own,
    needComplete: props.needComplete,
    needPlan: props.needPlan,
  });
  const visiblePhotos = gate ? photos.slice(0, 1) : photos;
  const locked = gate;
  const lockHref = props.needComplete ? props.finishHref : "/app/plans";
  const lockCta = props.needComplete ? "Complete my profile" : "See plans";
  const lockMessage = props.needComplete
    ? props.needPlan
      ? "Complete your biodata and keep a live plan to open this chapter of their story."
      : "Complete your biodata to open this chapter of their story."
    : "A live plan unlocks the full profile, extra photos, video and voice.";
  const personalDetails = (props.details ?? []).filter((group) => group.title === "Personal");
  const closedDetails = (props.details ?? []).filter((group) => group.title !== "Personal");
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
    setMounted(true);
  }, []);

  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get("safety");
    const contact = new URLSearchParams(window.location.search).get("contact");
    const err = new URLSearchParams(window.location.search).get("error");
    if (code === "shortlisted") setShortlistMsg("Added to shortlist");
    if (code === "unshortlisted") setShortlistMsg("Removed from shortlist");
    if (code === "shortlist_error") setShortlistMsg("Could not update shortlist");
    if (err === "incomplete") setShortlistMsg("Fill every house essential first, then you can send a request or view contact.");
    if (contact === "1") {
      const left = props.contact?.left;
      setShortlistMsg(
        left == null ? "Contact shown." : `Contact shown · ${left} left.`,
      );
    }
    if (code || contact === "1" || err === "incomplete") {
      window.clearTimeout(toastTimer.current);
      toastTimer.current = window.setTimeout(() => setShortlistMsg(null), 3200);
    }
  }, []);

  function flashShortlist(text: string) {
    setShortlistMsg(text);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setShortlistMsg(null), 2200);
  }

  function onShortlistClick() {
    const next = !listed;
    const gen = ++shortlistGen.current;
    setListed(next);
    flashShortlist(next ? "Added to shortlist" : "Removed from shortlist");
    void saveShortlist(props.id, next).then((res) => {
      if (gen !== shortlistGen.current) return;
      if (!res.ok) {
        setListed(!next);
        flashShortlist("Could not update shortlist");
      }
    });
  }

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
        <KindMark type={props.profileType} className="pv-kind" />
        <div className="pv-intro">
          <p className="pv-kicker">{props.memberCode ? `ID ${props.memberCode}` : "Member"}</p>
          <h1>
            {props.name}
            {props.surname ? ` ${props.surname}` : ""}
            {props.house === "staff" ? (
              <span className="pv-house is-staff" title="Staff" aria-label="Staff">
                ★
              </span>
            ) : null}
            {props.house === "admin" ? (
              <span className="pv-house is-admin" title="Admin" aria-label="Admin">
                ♔
              </span>
            ) : null}
          </h1>
          <p className="pv-meta">
            <span>
              {[props.age ? `${props.age} yrs` : null, props.place || null].filter(Boolean).join(" · ")}
            </span>
            {props.lastSeen ? <span className="pv-live">{props.lastSeen}</span> : null}
          </p>
          {(props.kundali?.total != null || (props.fitScore && props.fitScore.total > 0)) && !gate ? (
            <p className="pv-scores">
              {props.kundali?.total != null ? (
                <span className="pv-match-chip">
                  Kundali {props.kundali.total}/{props.kundali.max ?? 36}
                  {props.kundali.label ? ` · ${props.kundali.label}` : ""}
                </span>
              ) : null}
              {props.fitScore && props.fitScore.total > 0 ? (
                <span className="pv-match-chip is-fit">
                  Profile {props.fitScore.hit}/{props.fitScore.total}
                  {` · ${Math.round((props.fitScore.hit / props.fitScore.total) * 100)}% fit`}
                </span>
              ) : null}
            </p>
          ) : null}
          {props.verify?.length ? (
            <ul className="pv-verify" aria-label="Verification">
              {props.verify.map((item) => (
                <li key={item.id} className={item.on ? "is-on" : "is-off"} aria-label={`${item.label} ${item.on ? "verified" : "unverified"}`}>
                  <span aria-hidden>{item.on ? "✓" : "✕"}</span>
                  {item.label}
                  <em>{item.on ? "verified" : "unverified"}</em>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        {!props.own && props.user ? (
          <div className="pv-top-actions">
            <button
              type="button"
              className={`pv-ico-btn pv-short${listed ? " is-on" : ""}`}
              aria-label={listed ? "Shortlisted" : "Shortlist"}
              title={listed ? "Shortlisted" : "Shortlist"}
              data-tip={listed ? "Shortlisted" : "Shortlist"}
              onClick={onShortlistClick}
            >
              {listed ? "♥" : "♡"}
            </button>
            <SafetyProfileControl icons profileId={props.id} returnTo={`/browse/${props.id}`} name={props.name} />
          </div>
        ) : props.editHref ? (
          <div className="pv-top-actions">
            <Link href={props.editHref} className="pv-edit">
              Edit profile
            </Link>
          </div>
        ) : null}
      </header>

      {gate ? (
        <ReadyBanner
          needComplete={Boolean(props.needComplete)}
          needPlan={Boolean(props.needPlan)}
          pct={props.viewerReadyPct ?? 0}
          pending={props.pendingEssentials ?? 0}
          finishHref={props.finishHref}
        />
      ) : null}

      {props.matches?.length && !gate ? (
        <div className="pv-match-banner" aria-label="Matching points">
          <span className="pv-match-kicker">
            <CoupleMark className="pv-couple" />
            Why this fits
          </span>
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
          {personalDetails.length ? (
            <section className="pv-panel">
              <div className="pv-panel-head">
                <span className="pv-ico">▣</span>
                <span>Profile details</span>
              </div>
              <DetailTiles groups={personalDetails} />
            </section>
          ) : null}

          {closedDetails.length ? (
            <PlanLock on={locked} href={lockHref} cta={lockCta} message={lockMessage}>
              <section className="pv-panel">
                <div className="pv-panel-head">
                  <span className="pv-ico">▣</span>
                  <span>Job, family and more</span>
                </div>
                <DetailTiles groups={closedDetails} />
              </section>
            </PlanLock>
          ) : null}

          {props.hope?.length ? (
            <PlanLock on={locked} href={lockHref} cta={lockCta} message={lockMessage}>
            <section className="pv-panel">
              <div className="pv-panel-head">
                <span className="pv-ico">
                  <CoupleMark className="pv-couple" />
                </span>
                <span>Partner preference</span>
                {props.fitScore && props.fitScore.total > 0 ? (
                  <em className="pv-hope-fit">
                    You match {props.fitScore.hit} of {props.fitScore.total}
                  </em>
                ) : null}
              </div>
              <div className="pv-hope">
                {props.hope.map((item) => (
                  <div
                    key={item.k}
                    className={`pv-chip${item.fit === true ? " is-yes" : item.fit === false ? " is-no" : ""}`}
                  >
                    <span>
                      {item.fit === true ? "✓ " : item.fit === false ? "✕ " : ""}
                      {item.k}
                    </span>
                    <strong>{item.v}</strong>
                  </div>
                ))}
              </div>
            </section>
            </PlanLock>
          ) : null}

          {!props.own ? (
          <PlanLock on={locked} href={lockHref} cta={lockCta} message={lockMessage}>
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
          </PlanLock>
          ) : null}
        </div>

        <aside className="pv-media-col">
          {props.own && props.readiness ? (
            <div className="pv-complete-dock">
              <CompletenessMeter
                profileId={props.id}
                mandatoryPct={props.readiness.mandatoryPct}
                overallPct={props.readiness.overallPct}
                mandatoryFilled={props.readiness.mandatoryFilled}
                mandatoryTotal={props.readiness.mandatoryTotal}
                overallFilled={props.readiness.overallFilled}
                overallTotal={props.readiness.overallTotal}
                pendingMandatory={props.readiness.pendingMandatory}
                pendingRecommended={props.readiness.pendingRecommended}
              />
            </div>
          ) : null}
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
          {lightbox === null && spark ? <div className="pv-spark-box">{spark}</div> : null}
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
          {props.videoUrls?.length || props.voiceUrls?.length ? (
            <PlanLock on={locked} href={lockHref} cta={lockCta} message={lockMessage}>
              <>
                {props.videoUrls?.map((src, i) => (
                  <video key={src} className="pv-video" controls src={src} aria-label={`Video ${i + 1}`} />
                ))}
                {props.voiceUrls?.map((src, i) => (
                  <audio key={src} className="pv-audio" controls src={src} aria-label={`Voice ${i + 1}`} />
                ))}
              </>
            </PlanLock>
          ) : null}
          {!visiblePhotos.length && !props.videoUrls?.length && !props.voiceUrls?.length ? (
            <p className="pv-media-empty">No photo, video or voice yet.</p>
          ) : null}
        </aside>
      </div>

      {mounted && lightbox !== null && visiblePhotos[lightbox]
        ? createPortal(
            <div
              className="pv-lightbox"
              role="dialog"
              aria-modal="true"
              aria-label="Enlarged photo"
              onClick={() => setLightbox(null)}
            >
              <button
                type="button"
                className="pv-lightbox-nav"
                onClick={(event) => {
                  event.stopPropagation();
                  setLightbox((i) => (i == null ? 0 : (i - 1 + visiblePhotos.length) % visiblePhotos.length));
                }}
                aria-label="Previous photo"
              >
                ‹
              </button>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={visiblePhotos[lightbox]}
                alt={`${props.name} photo ${lightbox + 1}`}
                onClick={(event) => event.stopPropagation()}
              />
              <button
                type="button"
                className="pv-lightbox-nav"
                onClick={(event) => {
                  event.stopPropagation();
                  setLightbox((i) => (i == null ? 0 : (i + 1) % visiblePhotos.length));
                }}
                aria-label="Next photo"
              >
                ›
              </button>
              <button
                type="button"
                className="pv-lightbox-close"
                onClick={(event) => {
                  event.stopPropagation();
                  setLightbox(null);
                }}
              >
                Close
              </button>
              {spark ? (
                <div className="pv-lightbox-spark" onClick={(event) => event.stopPropagation()}>
                  {spark}
                </div>
              ) : null}
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
