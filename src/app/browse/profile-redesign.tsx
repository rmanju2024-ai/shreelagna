"use client";

import { useState } from "react";
import { toggleShortlist } from "@/app/app/profiles/actions";
import { SafetyProfileControl } from "@/app/app/safety/safety-profile-control";
import { BirdDock } from "@/app/browse/bird-dock";

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
    <div className="pr2-container">
      {/* Hero Section */}
      <section className="pr2-hero">
        {props.photos.length > 0 ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={props.photoUrl || ""} alt={props.name} className="pr2-hero-img" />
        ) : (
          <div className="pr2-hero-blank">
            <span>{props.name.slice(0, 1)}</span>
          </div>
        )}
        <div className="pr2-hero-info">
          <div>
            <h1>{props.name}</h1>
            {props.age || props.place ? (
              <p>
                {props.age && `${props.age}`}
                {props.age && props.place && " • "}
                {props.place}
              </p>
            ) : null}
            {props.lastSeen ? <p className="pr2-online">🟢 {props.lastSeen}</p> : null}
          </div>
        </div>
      </section>

      {/* Toast */}
      {shortlistMsg ? <div className="pr2-toast">{shortlistMsg}</div> : null}

      {/* Cards Grid */}
      <section className="pr2-cards">
        {/* About Card */}
        {props.about && (
          <div
            className={`pr2-card${expanded.about ? " is-expanded" : ""}`}
            onClick={() => toggleCard("about")}
          >
            <div className="pr2-card-head">
              <h2>👤 About</h2>
              <span className="pr2-toggle">{expanded.about ? "−" : "+"}</span>
            </div>
            {expanded.about && <p className="pr2-card-text">{props.about}</p>}
          </div>
        )}

        {/* Personal Card */}
        {props.personal && props.personal.length > 0 && (
          <div
            className={`pr2-card${expanded.personal ? " is-expanded" : ""}`}
            onClick={() => toggleCard("personal")}
          >
            <div className="pr2-card-head">
              <h2>💫 Personal</h2>
              <span className="pr2-toggle">{expanded.personal ? "−" : "+"}</span>
            </div>
            {expanded.personal && (
              <div className="pr2-card-body">
                {props.personal.map((group: any, i: number) => (
                  <div key={i} className="pr2-group">
                    <h3>{group.title}</h3>
                    <div className="pr2-items">
                      {group.items.map((item: any, j: number) => (
                        <div key={j} className="pr2-row">
                          <span className="pr2-label">{item.k}</span>
                          <span className="pr2-value">{item.v}</span>
                          {item.sub && <span className="pr2-sub">{item.sub}</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Faith Card */}
        {props.faith && props.faith.length > 0 && (
          <div
            className={`pr2-card${expanded.faith ? " is-expanded" : ""}`}
            onClick={() => toggleCard("faith")}
          >
            <div className="pr2-card-head">
              <h2>🙏 Faith & Values</h2>
              <span className="pr2-toggle">{expanded.faith ? "−" : "+"}</span>
            </div>
            {expanded.faith && (
              <div className="pr2-card-body">
                {props.faith.map((group: any, i: number) => (
                  <div key={i} className="pr2-group">
                    <h3>{group.title}</h3>
                    <div className="pr2-items">
                      {group.items.map((item: any, j: number) => (
                        <div key={j} className="pr2-row">
                          <span className="pr2-label">{item.k}</span>
                          <span className="pr2-value">{item.v}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Work Card */}
        {props.work && props.work.length > 0 && (
          <div
            className={`pr2-card${expanded.work ? " is-expanded" : ""}`}
            onClick={() => toggleCard("work")}
          >
            <div className="pr2-card-head">
              <h2>💼 Work & Education</h2>
              <span className="pr2-toggle">{expanded.work ? "−" : "+"}</span>
            </div>
            {expanded.work && (
              <div className="pr2-card-body">
                {props.work.map((group: any, i: number) => (
                  <div key={i} className="pr2-group">
                    <h3>{group.title}</h3>
                    <div className="pr2-items">
                      {group.items.map((item: any, j: number) => (
                        <div key={j} className="pr2-row">
                          <span className="pr2-label">{item.k}</span>
                          <span className="pr2-value">{item.v}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Family Card */}
        {props.family && props.family.length > 0 && (
          <div
            className={`pr2-card${expanded.family ? " is-expanded" : ""}`}
            onClick={() => toggleCard("family")}
          >
            <div className="pr2-card-head">
              <h2>👨‍👩‍👧 Family</h2>
              <span className="pr2-toggle">{expanded.family ? "−" : "+"}</span>
            </div>
            {expanded.family && (
              <div className="pr2-card-body">
                {props.family.map((group: any, i: number) => (
                  <div key={i} className="pr2-group">
                    <h3>{group.title}</h3>
                    <div className="pr2-items">
                      {group.items.map((item: any, j: number) => (
                        <div key={j} className="pr2-row">
                          <span className="pr2-label">{item.k}</span>
                          <span className="pr2-value">{item.v}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Seeking / Preferences Card */}
        {props.hope && props.hope.length > 0 && (
          <div
            className={`pr2-card${expanded.hope ? " is-expanded" : ""}`}
            onClick={() => toggleCard("hope")}
          >
            <div className="pr2-card-head">
              <h2>💕 Looking For</h2>
              <span className="pr2-toggle">{expanded.hope ? "−" : "+"}</span>
            </div>
            {expanded.hope && (
              <div className="pr2-card-body">
                {props.hope.map((group: any, i: number) => (
                  <div key={i} className="pr2-group">
                    <h3>{group.title}</h3>
                    <div className="pr2-items">
                      {group.items.map((item: any, j: number) => (
                        <div key={j} className="pr2-row">
                          <span className="pr2-label">{item.k}</span>
                          <span className="pr2-value">{item.v}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Kundali Card */}
        {props.kundali && (
          <div
            className={`pr2-card pr2-card-kundali${expanded.kundali ? " is-expanded" : ""}`}
            onClick={() => toggleCard("kundali")}
          >
            <div className="pr2-card-head">
              <h2>🌙 Kundali Match</h2>
              <span className="pr2-toggle">{expanded.kundali ? "−" : "+"}</span>
            </div>
            {expanded.kundali && (
              <div className="pr2-card-body">
                <div className="pr2-kundali-main">
                  <div className="pr2-kundali-score">
                    <strong>{props.kundali.total}/{props.kundali.max}</strong>
                    <small>{props.kundali.label}</small>
                  </div>
                  <div className="pr2-kundali-list">
                    {props.kundali.parts &&
                      props.kundali.parts.map((part: any, i: number) => (
                        <div key={i} className="pr2-kundali-item">
                          <span>{part.k}</span>
                          <strong>{part.score}/{part.max}</strong>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Action Buttons */}
      {!props.own && props.user ? (
        <section className="pr2-actions">
          <form action={toggleShortlist} onSubmit={handleShortlist}>
            <input type="hidden" name="profile_id" value={props.id} />
            <input type="hidden" name="return_to" value={`/browse/${props.id}`} />
            <button type="submit" className={`pr2-btn-primary${props.shortlisted ? " is-on" : ""}`}>
              {props.shortlisted ? "♥ Shortlisted" : "♡ Shortlist"}
            </button>
          </form>
          <SafetyProfileControl profileId={props.id} returnTo={`/browse/${props.id}`} name={props.name} />
        </section>
      ) : null}

      {/* Send Interest */}
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
