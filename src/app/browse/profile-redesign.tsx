"use client";

import { useState, useEffect, useRef } from "react";
import { toggleShortlist } from "@/app/app/profiles/actions";
import { SafetyProfileControl } from "@/app/app/safety/safety-profile-control";
import { BirdDock } from "@/app/browse/bird-dock";
import { displayFirstName } from "@/lib/profile/options";
import Link from "next/link";

export type ProfileSection = {
  id: string;
  label: string;
  icon: string;
};

export type ProfileData = {
  id: string;
  name: string;
  age: number | null;
  place: string;
  lastSeen: string | null;
  photos: Array<{ storage_path: string }>;
  photoUrl: string | null;
  memberCode?: string;
  about?: string | null;
  personal?: any;
  faith?: any;
  work?: any;
  family?: any;
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

const SECTIONS: ProfileSection[] = [
  { id: "about", label: "About", icon: "👤" },
  { id: "personal", label: "Personal", icon: "💫" },
  { id: "faith", label: "Faith", icon: "🙏" },
  { id: "work", label: "Work", icon: "💼" },
  { id: "family", label: "Family", icon: "👨‍👩‍👧" },
  { id: "hope", label: "Seeking", icon: "💕" },
  { id: "kundali", label: "Kundali", icon: "🌙" },
];

export function ProfileRedesign(props: ProfileData) {
  const [activeSection, setActiveSection] = useState("about");
  const [shortlistMsg, setShortlistMsg] = useState<string | null>(null);
  const [sectionRefs, setSectionRefs] = useState<Record<string, HTMLElement | null>>({});
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  async function handleShortlist(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setShortlistMsg(props.shortlisted ? "Removing from shortlist..." : "Adding to shortlist...");
    try {
      await toggleShortlist(new FormData(e.currentTarget));
      setShortlistMsg(props.shortlisted ? "Removed from shortlist" : "Added to shortlist");
      setTimeout(() => setShortlistMsg(null), 3000);
    } catch {
      setShortlistMsg("Could not update shortlist");
      setTimeout(() => setShortlistMsg(null), 3000);
    }
  }

  function handleNavClick(sectionId: string) {
    setActiveSection(sectionId);
    const element = sectionRefs[sectionId];
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  return (
    <div className="pr-container">
      {/* Hero: Full photo + overlay info */}
      <section className="pr-hero">
        {props.photos.length > 0 ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={props.photoUrl || ""} alt={props.name} className="pr-hero-image" />
        ) : (
          <div className="pr-hero-placeholder">
            <span>{props.name.slice(0, 1)}</span>
          </div>
        )}
        <div className="pr-hero-overlay">
          <div className="pr-hero-info">
            <h1>{props.name}</h1>
            {props.age || props.place ? (
              <p className="pr-hero-meta">
                {props.age && `${props.age} years`}
                {props.age && props.place && " · "}
                {props.place}
              </p>
            ) : null}
            {props.lastSeen ? <p className="pr-hero-online">● {props.lastSeen}</p> : null}
          </div>
          {props.photos.length > 1 && (
            <div className="pr-photo-count">{props.photos.length} photos</div>
          )}
        </div>
      </section>

      {/* Toast message */}
      {shortlistMsg ? (
        <div className="pr-toast" role="status">{shortlistMsg}</div>
      ) : null}

      {/* Sticky nav tabs */}
      <nav className="pr-nav">
        <div className="pr-nav-track">
          {SECTIONS.map((section) => (
            <button
              key={section.id}
              className={`pr-nav-item${activeSection === section.id ? " is-active" : ""}`}
              onClick={() => handleNavClick(section.id)}
              aria-selected={activeSection === section.id}
            >
              <span className="pr-nav-icon">{section.icon}</span>
              <span className="pr-nav-label">{section.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Scrollable content sections */}
      <div className="pr-content" ref={scrollContainerRef}>
        {/* About */}
        <section className="pr-section" ref={(el) => { if (el) sectionRefs["about"] = el; }} id="about">
          {props.about ? (
            <div className="pr-block">
              <p className="pr-about-text">{props.about}</p>
            </div>
          ) : (
            <p className="pr-empty">No about info yet</p>
          )}
        </section>

        {/* Personal */}
        <section className="pr-section" ref={(el) => { if (el) sectionRefs["personal"] = el; }} id="personal">
          {props.personal && props.personal.length > 0 ? (
            props.personal.map((group: any, i: number) => (
              <div key={i} className="pr-group">
                <h3 className="pr-group-title">{group.title}</h3>
                <div className="pr-grid">
                  {group.items.map((item: any, j: number) => (
                    <div key={j} className="pr-item">
                      <small>{item.k}</small>
                      <strong>{item.v}</strong>
                      {item.sub && <small className="pr-sub">{item.sub}</small>}
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <p className="pr-empty">No personal info</p>
          )}
        </section>

        {/* Faith */}
        <section className="pr-section" ref={(el) => { if (el) sectionRefs["faith"] = el; }} id="faith">
          {props.faith && props.faith.length > 0 ? (
            props.faith.map((group: any, i: number) => (
              <div key={i} className="pr-group">
                <h3 className="pr-group-title">{group.title}</h3>
                <div className="pr-grid">
                  {group.items.map((item: any, j: number) => (
                    <div key={j} className="pr-item">
                      <small>{item.k}</small>
                      <strong>{item.v}</strong>
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <p className="pr-empty">No faith info</p>
          )}
        </section>

        {/* Work */}
        <section className="pr-section" ref={(el) => { if (el) sectionRefs["work"] = el; }} id="work">
          {props.work && props.work.length > 0 ? (
            props.work.map((group: any, i: number) => (
              <div key={i} className="pr-group">
                <h3 className="pr-group-title">{group.title}</h3>
                <div className="pr-grid">
                  {group.items.map((item: any, j: number) => (
                    <div key={j} className="pr-item">
                      <small>{item.k}</small>
                      <strong>{item.v}</strong>
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <p className="pr-empty">No work info</p>
          )}
        </section>

        {/* Family */}
        <section className="pr-section" ref={(el) => { if (el) sectionRefs["family"] = el; }} id="family">
          {props.family && props.family.length > 0 ? (
            props.family.map((group: any, i: number) => (
              <div key={i} className="pr-group">
                <h3 className="pr-group-title">{group.title}</h3>
                <div className="pr-grid">
                  {group.items.map((item: any, j: number) => (
                    <div key={j} className="pr-item">
                      <small>{item.k}</small>
                      <strong>{item.v}</strong>
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <p className="pr-empty">No family info</p>
          )}
        </section>

        {/* Hope / Seeking */}
        <section className="pr-section" ref={(el) => { if (el) sectionRefs["hope"] = el; }} id="hope">
          {props.hope && props.hope.length > 0 ? (
            props.hope.map((group: any, i: number) => (
              <div key={i} className="pr-group">
                <h3 className="pr-group-title">{group.title}</h3>
                <div className="pr-grid">
                  {group.items.map((item: any, j: number) => (
                    <div key={j} className="pr-item">
                      <small>{item.k}</small>
                      <strong>{item.v}</strong>
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <p className="pr-empty">No preference info</p>
          )}
        </section>

        {/* Kundali */}
        <section className="pr-section" ref={(el) => { if (el) sectionRefs["kundali"] = el; }} id="kundali">
          {props.kundali ? (
            <div className="pr-group">
              <div className="pr-kundali-score">
                <div className="pr-score-circle">
                  <strong>{props.kundali.total}/{props.kundali.max}</strong>
                  <small>points</small>
                </div>
                <p className="pr-kundali-label">{props.kundali.label}</p>
              </div>
              <div className="pr-kundali-parts">
                {props.kundali.parts && props.kundali.parts.map((part: any, i: number) => (
                  <div key={i} className="pr-kundali-part">
                    <span>{part.k}</span>
                    <strong>{part.score}/{part.max}</strong>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="pr-empty">Kundali info not available</p>
          )}
        </section>
      </div>

      {/* Action buttons */}
      {!props.own && props.user ? (
        <section className="pr-actions">
          <form action={toggleShortlist} onSubmit={handleShortlist} className="pr-action-form">
            <input type="hidden" name="profile_id" value={props.id} />
            <input type="hidden" name="return_to" value={`/browse/${props.id}`} />
            <button type="submit" className={`pr-btn-shortlist${props.shortlisted ? " is-on" : ""}`}>
              {props.shortlisted ? "♥ Shortlisted" : "♡ Shortlist"}
            </button>
          </form>
          <SafetyProfileControl profileId={props.id} returnTo={`/browse/${props.id}`} name={props.name} />
        </section>
      ) : null}

      {/* Send Interest bird */}
      {!props.own && props.user ? (
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
      ) : null}
    </div>
  );
}
