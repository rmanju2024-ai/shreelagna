"use client";

import { Fragment, useEffect, useState } from "react";
import Link from "next/link";
import { CopyMemberId } from "@/app/app/profiles/copy-member-id";
import { btnGhost, btnPrimary } from "@/lib/ui/classes";
import { type ProfileEditTarget } from "@/lib/profile/sections";
import { AboutHtml } from "@/app/app/profiles/about-html";
import { aboutPlainText } from "@/lib/profile/about-html";
import { isOnlineNow, lastOnlineLine } from "@/lib/profile/last-seen";

type Fact = {
  k: string;
  v: string;
  sub?: string;
  extra?: React.ReactNode;
  required?: boolean;
  match?: boolean | null;
  you?: string;
};
type FactGroup = { title: string; items: Fact[] };
type HopeSheet = {
  rows: { k: string; v: string; match: boolean | null }[];
  theirPhoto?: string | null;
  yourPhoto?: string | null;
  pronoun: "her" | "his" | "their";
};

export function PortraitSheet({
  album,
  kind,
  profileType,
  name,
  memberCode,
  posted,
  editHref,
  about,
  introMedia,
  introEdit = "about",
  personal,
  faith,
  work,
  family,
  familyNote,
  hope,
  hopeSheet,
  initialTab,
  editable = true,
  houseEdit = false,
  interest,
  lastSeenAt,
  needPlan = false,
}: {
  album: React.ReactNode;
  kind: string;
  profileType?: string;
  name: string;
  memberCode?: string;
  posted: string;
  editHref: string;
  about?: string | null;
  introMedia?: React.ReactNode;
  introEdit?: ProfileEditTarget;
  personal?: FactGroup[];
  faith?: FactGroup[];
  work?: FactGroup[];
  family?: FactGroup[];
  familyNote?: string | null;
  hope?: FactGroup[];
  hopeSheet?: HopeSheet | null;
  initialTab?: string;
  editable?: boolean;
  houseEdit?: boolean;
  interest?: React.ReactNode;
  lastSeenAt?: string | null;
  needPlan?: boolean;
}) {
  const personalGroups = personal ?? [];
  const faithGroups = faith ?? [];
  const workGroups = work ?? [];
  const familyGroups = family ?? [];
  const hopeGroups = hope ?? [];
  const tabs = [
    { id: "personal", label: "Personal", short: "Personal" },
    { id: "faith", label: "Religion & astronomy", short: "Rel & Astro" },
    { id: "work", label: "Education & work", short: "Edu & Career" },
    { id: "family", label: "Family", short: "Family" },
    { id: "partner", label: "Partner Preference", short: "Partner Pref." },
  ];
  const tabIds = tabs.map((t) => t.id);
  const startTab = initialTab && tabIds.includes(initialTab) ? initialTab : "personal";
  const aboutText = aboutPlainText(about ?? "");
  const lastSeen = lastOnlineLine(lastSeenAt, profileType);
  const [tab, setTab] = useState(startTab);

  function sectionHref(target: ProfileEditTarget) {
    return `${editHref}&section=${target}`;
  }

  return (
    <article className="portrait-sheet">
      <div className="portrait-sheet-shine" aria-hidden />
      <aside className={`portrait-tabs portrait-rail portrait-theme-${tab}`}>
        <div className="portrait-tabs-list" role="tablist" aria-label="Profile sections">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              className={`portrait-tab-${t.id}${tab === t.id ? " is-on" : ""}`}
              onClick={() => setTab(t.id)}
            >
              <span className="portrait-tab-full">{t.label}</span>
              <span className="portrait-tab-short">{t.short}</span>
            </button>
          ))}
        </div>
      </aside>
      <div className="portrait-main">
      <div className="portrait-sheet-top">
        {editable ? (
          <Link href={sectionHref("album")} className={`${btnGhost} portrait-album-edit`}>
            Edit album
          </Link>
        ) : houseEdit ? (
          <Link href={editHref} className={`${btnGhost} portrait-album-edit`} prefetch={false}>
            Edit
          </Link>
        ) : null}
        <div className="portrait-sheet-photo">
          <div className="portrait-photo-frame">{album}</div>
        </div>
      </div>
      <div className="portrait-details">
        <div className="portrait-sheet-id">
          <div className="portrait-sheet-id-head">
            <div className="portrait-id-slot">
              <div className="portrait-sheet-id-copy">
                <p className="portrait-sheet-meta">
                  <span className="portrait-kind">{kind}</span>
                  {memberCode ? (
                    <>
                      <i>·</i>
                      <CopyMemberId code={memberCode} />
                    </>
                  ) : (
                    <>
                      <i>·</i>
                      <span>Pending ID</span>
                    </>
                  )}
                  <i>·</i>
                  <span>{posted}</span>
                </p>
                <h1>{name}</h1>
                <div className="gold-ornament" />
                <QuickFacts groups={[...personalGroups, ...workGroups]} sheet={hopeSheet ?? null} />
                {lastSeen ? (
                  <p className={`portrait-last-seen${isOnlineNow(lastSeenAt) ? " is-now" : ""}`}>
                    <i aria-hidden />
                    {lastSeen}
                  </p>
                ) : null}
              </div>
              {aboutText || introMedia || editable ? (
                <div className="portrait-intro-slot">
                  <Gate on={needPlan}>
                    <IntroductionPane about={aboutText ? about : null} media={introMedia} editable={editable} />
                  </Gate>
                  {editable ? (
                    <Link href={sectionHref(introEdit)} className={`${btnGhost} portrait-intro-edit`}>
                      Edit intro
                    </Link>
                  ) : null}
                </div>
              ) : null}
            </div>
            {interest ? <div className="portrait-interest">{interest}</div> : null}
          </div>
        </div>

      <div className={`portrait-sheet-body portrait-theme-${tab}`}>
        <div className="portrait-tab-frame">
          {editable ? (
            <Link
              href={sectionHref(tab as ProfileEditTarget)}
              className={`${btnPrimary} portrait-body-edit portrait-tab-edit-${tab}`}
            >
              Edit
            </Link>
          ) : null}
          <div className="portrait-tab-live">
            {tab === "personal" ? (
              <FactGroups
                groups={personalGroups}
                gateTitles={needPlan ? ["Health and habits"] : []}
                gateKeys={needPlan ? ["Mobile", "Email ID"] : []}
              />
            ) : null}
            {tab === "faith" ? (
              <FactGroups groups={faithGroups} gateTitles={needPlan ? ["Astronomy"] : []} />
            ) : null}
            {tab === "work" ? <FactGroups groups={workGroups} /> : null}
            {tab === "family" ? (
              <Gate on={needPlan}>
                <FactGroups groups={familyGroups} />
                <FamilyAbout note={familyNote} />
              </Gate>
            ) : null}
            {tab === "partner" ? (
              hopeSheet ? (
                <PreferenceSheet sheet={hopeSheet} />
              ) : (
                <FactGroups groups={hopeGroups} />
              )
            ) : null}
          </div>
        </div>
      </div>
      </div>
      </div>
    </article>
  );
}

function Gate({ on, children }: { on?: boolean; children: React.ReactNode }) {
  if (!on) return children;
  return (
    <div className="portrait-gate">
      <div className="portrait-gate-body" aria-hidden>
        {children}
      </div>
      <Link href="/app/plans" className="portrait-gate-veil">
        Subscribe to view
      </Link>
    </div>
  );
}

function IntroductionPane({
  about,
  media,
  editable,
}: {
  about?: string | null;
  media?: React.ReactNode;
  editable: boolean;
}) {
  if (about) {
    return (
      <section className="portrait-group portrait-intro">
        <blockquote className="portrait-quote portrait-quote-lead">
          <AboutHtml html={about} />
        </blockquote>
      </section>
    );
  }
  if (media) {
    return <div className="portrait-intro portrait-intro-media">{media}</div>;
  }
  return editable ? (
    <p className="portrait-empty">Add words, a short video, or a voice note.</p>
  ) : null;
}

function FamilyAbout({ note }: { note?: string | null }) {
  return (
    <section className="portrait-group portrait-family-note">
      <h3 className="portrait-group-title">About the family</h3>
      <div className="gold-ornament" />
      {note ? (
        <blockquote className="portrait-quote">
          <AboutHtml html={note} />
        </blockquote>
      ) : (
        <p className="portrait-empty">Nothing written about the family yet.</p>
      )}
    </section>
  );
}

function FactGroups({
  groups,
  gateTitles = [],
  gateKeys = [],
}: {
  groups?: FactGroup[];
  gateTitles?: string[];
  gateKeys?: string[];
}) {
  return (
    <div className="portrait-groups">
      {(groups ?? []).map((group) => (
        <Fragment key={group.title}>
          <Gate on={gateTitles.includes(group.title)}>
            <section className="portrait-group">
              <h3 className="portrait-group-title">{group.title}</h3>
              <div className="gold-ornament" />
              <FactRows items={group.items ?? []} gateKeys={gateKeys} />
            </section>
          </Gate>
        </Fragment>
      ))}
    </div>
  );
}

function PreferenceSheet({ sheet }: { sheet: HopeSheet }) {
  const hit = sheet.rows.filter((r) => r.match === true).length;
  const total = sheet.rows.length;
  return (
    <section className="pref-sheet">
      <div className="pref-sheet-hero">
        <PrefPhoto src={sheet.theirPhoto} label="Their photograph" />
        <p className="pref-sheet-count">
          You match {hit}/{total} partner preferences
        </p>
        <PrefPhoto src={sheet.yourPhoto} label="Your photograph" />
      </div>
      <div className="pref-sheet-head">
        <span>Partner Preference</span>
        <span>You match</span>
      </div>
      <dl className="pref-sheet-list">
        {sheet.rows.map((row) => (
          <div key={row.k}>
            <dt>{row.k}</dt>
            <dd>
              <PrefValue text={row.v} />
              {row.match === true ? (
                <span className="pref-mark is-yes" aria-label="You match">
                  ✓
                </span>
              ) : (
                <span className="pref-mark is-dash" aria-label="Does not match">
                  —
                </span>
              )}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function PrefPhoto({ src, label }: { src?: string | null; label: string }) {
  if (!src) {
    return <span className="pref-photo pref-photo-empty" aria-label={label} />;
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img className="pref-photo" src={src} alt="" />
  );
}

function PrefValue({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  const long = text.length > 72;
  const shown = !long || open ? text : `${text.slice(0, 68).trimEnd()}…`;
  return (
    <p>
      {shown}
      {long ? (
        <button type="button" className="pref-more" onClick={() => setOpen((v) => !v)}>
          {open ? "less" : "more"}
        </button>
      ) : null}
    </p>
  );
}

function FactRows({ items, gateKeys = [] }: { items?: Fact[]; gateKeys?: string[] }) {
  return (
    <dl className="portrait-rows">
      {(items ?? []).map((s) => (
        <Fragment key={s.k}>
          <Gate on={gateKeys.includes(s.k)}>
            <div className={s.match === true ? "is-match" : s.match === false ? "is-miss" : undefined}>
              <dt>
                {s.k}
                {s.required ? (
                  <span className="need-star" title="Mandatory" aria-label="Mandatory">
                    *
                  </span>
                ) : null}
              </dt>
              <dd>
                <span className="portrait-fact-main">
                  <span>{s.v}</span>
                  {s.sub ? <small className="portrait-fact-sub">{s.sub}</small> : null}
                </span>
                {s.match === true ? (
                  <span className="portrait-tick is-yes" aria-label="Matches you">
                    ✓
                  </span>
                ) : null}
                {s.match === false ? (
                  <span className="portrait-tick is-no" aria-label="Does not match you">
                    ✕
                  </span>
                ) : null}
              </dd>
              {s.you ? <p className="portrait-fact-you">You: {s.you}</p> : null}
              {s.extra ? <div className="portrait-fact-extra">{s.extra}</div> : null}
            </div>
          </Gate>
        </Fragment>
      ))}
    </dl>
  );
}

const CHIP_KEYS = ["Height", "Marital status", "Highest education", "Working as", "Current residence", "Diet", "Mother tongue", "Annual income"];

function QuickFacts({ groups, sheet }: { groups: FactGroup[]; sheet: HopeSheet | null }) {
  const all = groups.flatMap((g) => g.items);
  const chips = CHIP_KEYS.map((key) => all.find((i) => i.k === key))
    .filter((i): i is Fact => Boolean(i && i.v && i.v !== "—"))
    .slice(0, 8);
  const total = sheet?.rows.length ?? 0;
  const hit = sheet?.rows.filter((r) => r.match === true).length ?? 0;
  const pct = total ? Math.round((hit / total) * 100) : 0;
  const why = (sheet?.rows ?? []).filter((r) => r.match === true && r.v && r.v !== "—").slice(0, 3).map((r) => r.k);
  const [shown, setShown] = useState(0);
  useEffect(() => {
    if (!pct) return;
    let n = 0;
    const id = window.setInterval(() => {
      n = Math.min(pct, n + Math.max(1, Math.round(pct / 22)));
      setShown(n);
      if (n >= pct) window.clearInterval(id);
    }, 28);
    return () => window.clearInterval(id);
  }, [pct]);
  if (!chips.length && !total) return null;
  return (
    <div className="qf">
      {total ? (
        <div className="qf-match">
          <svg className="qf-ring" viewBox="0 0 36 36" aria-label={`${pct}% match`}>
            <circle cx="18" cy="18" r="15.9" className="qf-ring-bg" />
            <circle cx="18" cy="18" r="15.9" className="qf-ring-fill" style={{ strokeDasharray: `${pct} 100` }} />
          </svg>
          <b className="qf-pct">{shown}%</b>
          <span className="qf-why">{why.length ? `You match: ${why.join(" · ")}` : `${hit}/${total} preferences match`}</span>
        </div>
      ) : null}
      {chips.length ? (
        <ul className="qf-chips">
          {chips.map((c, i) => (
            <li key={c.k} style={{ animationDelay: `${0.1 + i * 0.06}s` }}>
              <small>{c.k.replace("Highest ", "").replace("Current residence", "Lives in")}</small>
              <b>{c.v}</b>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
