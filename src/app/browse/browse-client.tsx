"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { BrowseCard, type BrowseCardNote } from "@/app/browse/browse-card";
import { BrowseFilterDesk } from "@/app/browse/browse-filter-desk";
import { EMPTY_BROWSE_FILTERS, profileFitsBrowse, type BrowseFilters } from "@/lib/match/browse-filters";
import { type BrowseScoreRow, type BrowseView } from "@/lib/match/browse-match";
import { pageCount, pageItems } from "@/lib/match/inbox-card";
import { btnGhost, btnPrimary, cardClass } from "@/lib/ui/classes";

type ViewItem = {
  id: BrowseView;
  label: string;
  short: string;
  hint: string;
  empty: string;
};

const DEFAULT_VIEWS: ViewItem[] = [
  { id: "fits", label: "Today’s picks", short: "Today", hint: "Curated from your preference", empty: "No matching profiles here yet" },
  { id: "prefers", label: "They like you", short: "They like you", hint: "10/15 of their preference", empty: "No one has you on their preference yet" },
  { id: "kundali", label: "Kundali match", short: "Kundali", hint: "18 or more of 36", empty: "No kundali matches here yet" },
];

const EXTRA_VIEWS: ViewItem[] = [
  { id: "nearby", label: "Nearby", short: "Nearby", hint: "Within 100 km", empty: "No families within 100 km yet" },
  { id: "community", label: "Same community", short: "Same community", hint: "Your community", empty: "No one from your community yet" },
  { id: "custom", label: "Advanced filter", short: "Advanced filter", hint: "Age, city, community", empty: "No profiles match these choices" },
];

const ALL_VIEWS = [...DEFAULT_VIEWS, ...EXTRA_VIEWS];
const PREVIEW_VIEWS = ALL_VIEWS.filter((item) => item.id !== "custom");

function fitsCustom(note: BrowseCardNote, filters: BrowseFilters): boolean {
  return profileFitsBrowse(
    {
      date_of_birth: note.date_of_birth,
      current_country: note.current_country,
      current_state: note.state,
      current_city: note.city,
      religion_name: note.religion,
      community_name: note.community,
      diet: note.diet,
      qualification: note.education,
      income_band: note.income_band,
    },
    filters,
  );
}

function notesFor(catalog: Record<string, BrowseCardNote>, rows: BrowseScoreRow[] | undefined): BrowseCardNote[] {
  const out: BrowseCardNote[] = [];
  for (const row of rows ?? []) {
    const card = catalog[row.id];
    if (!card) continue;
    out.push(row.score ? { ...card, score: row.score } : card);
  }
  return out;
}

function resultsHref(view: BrowseView, filters: BrowseFilters) {
  const params = new URLSearchParams({ view });
  if (view === "custom") {
    if (filters.ageMin) params.set("age_min", String(filters.ageMin));
    if (filters.ageMax) params.set("age_max", String(filters.ageMax));
    (["country", "state", "city", "religion", "community", "lifestyle", "education", "income"] as const).forEach((key) => {
      if (filters[key].length) params.set(key, filters[key].join(","));
    });
  }
  return `/browse/results?${params}`;
}

function RowArrow({
  label,
  direction,
  onClick,
}: {
  label: string;
  direction: "left" | "right";
  onClick: () => void;
}) {
  return (
    <button type="button" className={`sx-row-arrow is-${direction}`} aria-label={label} onClick={onClick}>
      {direction === "left" ? "‹" : "›"}
    </button>
  );
}

function CategoryRow({
  item,
  notes,
  count,
  gate,
}: {
  item: ViewItem;
  notes: BrowseCardNote[];
  count: number;
  gate?: string;
}) {
  const scroller = useRef<HTMLUListElement>(null);
  const preview = notes.slice(0, 5);
  return (
    <section className="sx-feed-row" aria-labelledby={`discover-${item.id}`}>
      <header className="sx-feed-head">
        <div>
          <p className="sx-feed-kicker">{item.short}</p>
          <h2 id={`discover-${item.id}`}><span>{item.label}</span></h2>
          <p>{count} {count === 1 ? "profile" : "profiles"} · {item.hint}</p>
        </div>
        {count > 5 ? (
          <a className="sx-view-all" href={resultsHref(item.id, EMPTY_BROWSE_FILTERS)}>
            View all {count} profiles <span aria-hidden>→</span>
          </a>
        ) : null}
      </header>
      {gate && preview.length ? <p className="sx-note">{gate}</p> : null}
      {preview.length ? (
        <div className="sx-row-shell">
          <RowArrow
            label={`Show previous ${item.label} profiles`}
            direction="left"
            onClick={() => scroller.current?.scrollBy({ left: -280, behavior: "smooth" })}
          />
          <ul className="sx-row" ref={scroller}>
            {preview.map((note, index) => (
              <BrowseCard key={`${item.id}-${note.id}`} note={note} priority={item.id === "fits" && index < 3} />
            ))}
          </ul>
          <RowArrow
            label={`Show more ${item.label} profiles`}
            direction="right"
            onClick={() => scroller.current?.scrollBy({ left: 280, behavior: "smooth" })}
          />
        </div>
      ) : (
        <div className="sx-empty">
          <h3>{gate || item.empty}</h3>
        </div>
      )}
    </section>
  );
}

export function BrowseClient({
  lookingFor,
  notice,
  user,
  error,
  initialView,
  initialFilters,
  catalog,
  lists,
  viewNotes,
  religions,
  communities,
  fullResults = false,
}: {
  lookingFor: string | null;
  notice: string | null;
  user: boolean;
  error?: string;
  initialView: BrowseView;
  initialFilters: BrowseFilters;
  catalog: Record<string, BrowseCardNote>;
  lists: Record<BrowseView, BrowseScoreRow[]>;
  viewNotes?: Partial<Record<BrowseView, string>>;
  religions: string[];
  communities: string[];
  fullResults?: boolean;
}) {
  const [filters, setFilters] = useState<BrowseFilters>(
    initialView === "custom" ? initialFilters : EMPTY_BROWSE_FILTERS,
  );
  const [page, setPage] = useState(1);
  const [customApplied, setCustomApplied] = useState(
    initialView === "custom" && JSON.stringify(initialFilters) !== JSON.stringify(EMPTY_BROWSE_FILTERS),
  );

  const rankedByView = useMemo(() => {
    const next = {} as Record<BrowseView, BrowseCardNote[]>;
    (Object.keys(lists) as BrowseView[]).forEach((key) => {
      const rows = notesFor(catalog, lists[key]);
      next[key] = key === "custom" && customApplied ? rows.filter((note) => fitsCustom(note, filters)) : rows;
    });
    return next;
  }, [catalog, lists, filters, customApplied]);

  const currentView = ALL_VIEWS.find((item) => item.id === initialView) ?? DEFAULT_VIEWS[0];
  const ranked = currentView.id === "custom" && !customApplied ? [] : rankedByView[currentView.id] ?? [];
  const pages = pageCount(ranked.length, 10);
  const currentPage = Math.min(page, pages);
  const shown = pageItems(ranked, currentPage, 10);
  const totalShown = PREVIEW_VIEWS.reduce((sum, item) => sum + (rankedByView[item.id]?.length ?? 0), 0);
  const resultHref = resultsHref(currentView.id, filters);
  const discoverHref = resultHref.replace("/browse/results", "/browse");

  return (
    <div className="sx-stage">
      <header className="sx-hero">
        <div>
          <p className="sx-eyebrow">Search</p>
          <h1>{fullResults ? currentView.label : lookingFor ? `Find your ${lookingFor}` : "Find your match"}</h1>
        </div>
        {fullResults ? <Link href={discoverHref} className="sx-back-to-discover">← Back to Discover</Link> : null}
        {!notice ? (
          <p className="sx-hero-count">
            <b>{fullResults ? ranked.length : totalShown}</b>
            <span>{(fullResults ? ranked.length : totalShown) === 1 ? "profile" : "profiles"}</span>
          </p>
        ) : null}
      </header>

      {error === "need_profile" ? (
        <p className="browse-flash is-warn">Create and activate a profile before sending interest.</p>
      ) : null}
      {error === "unavailable" ? (
        <p className="browse-flash is-warn">That profile is hidden or no longer available.</p>
      ) : null}

      <div className="sx-board">
        {notice ? (
          <div className={`${cardClass} browse-gate`}>
            <p className="browse-kicker">Members only</p>
            <h2>Begin with a profile</h2>
            <p>{notice}</p>
            <div className="browse-panel-actions">
              {user ? (
                <Link href="/app/profiles/new" className={btnPrimary}>Create a profile</Link>
              ) : (
                <Link href="/login" className={btnPrimary}>Sign in with Gmail</Link>
              )}
              <Link href="/contact" className={btnGhost}>Write to us</Link>
            </div>
          </div>
        ) : fullResults ? (
          <section className="sx-results" aria-live="polite">
            <header className="sx-results-head">
              <p>{ranked.length} {ranked.length === 1 ? "profile" : "profiles"} · {currentView.hint}</p>
            </header>
            {viewNotes?.[currentView.id] && shown.length ? <p className="sx-note">{viewNotes[currentView.id]}</p> : null}
            {shown.length ? (
              <ul className="sx-grid is-results-list">
                {shown.map((note, index) => (
                  <BrowseCard key={`${currentView.id}-${note.id}`} note={note} priority={index < 3} />
                ))}
              </ul>
            ) : (
              <div className="sx-empty">
                <h3>{viewNotes?.[currentView.id] || (currentView.id === "custom" && !customApplied ? "Choose filters, then tap Apply to see profiles." : currentView.empty)}</h3>
              </div>
            )}
            {pages > 1 ? (
              <nav className="sx-pager" aria-label="Search pages">
                {currentPage > 1 ? (
                  <button type="button" className={btnGhost} onClick={() => setPage(currentPage - 1)}>Previous</button>
                ) : (
                  <span />
                )}
                <p>Page {currentPage} of {pages}</p>
                {currentPage < pages ? (
                  <button type="button" className={btnGhost} onClick={() => setPage(currentPage + 1)}>Next</button>
                ) : (
                  <span />
                )}
              </nav>
            ) : null}
          </section>
        ) : (
          <div className="sx-feed">
            {PREVIEW_VIEWS.map((item) => (
              <CategoryRow
                key={item.id}
                item={item}
                notes={rankedByView[item.id] ?? []}
                count={rankedByView[item.id]?.length ?? 0}
                gate={viewNotes?.[item.id]}
              />
            ))}
            <section className="sx-feed-row" aria-labelledby="discover-custom">
              <header className="sx-feed-head">
                <div>
                  <p className="sx-feed-kicker">Filter</p>
                  <h2 id="discover-custom"><span>Advanced filter</span></h2>
                  <p>Set what you want, then Apply. Nothing lists until you do.</p>
                </div>
                {customApplied && rankedByView.custom.length > 5 ? (
                  <a className="sx-view-all" href={resultsHref("custom", filters)}>
                    View all {rankedByView.custom.length} profiles <span aria-hidden>→</span>
                  </a>
                ) : null}
              </header>
              <BrowseFilterDesk
                filters={filters}
                religions={religions}
                communities={communities}
                onApply={(next) => {
                  setFilters(next);
                  setPage(1);
                  setCustomApplied(true);
                }}
                onClear={() => {
                  setFilters(EMPTY_BROWSE_FILTERS);
                  setPage(1);
                  setCustomApplied(false);
                }}
              />
              {customApplied ? (
                rankedByView.custom.length ? (
                  <ul className="sx-row">
                    {rankedByView.custom.slice(0, 5).map((note) => (
                      <BrowseCard key={`custom-${note.id}`} note={note} />
                    ))}
                  </ul>
                ) : (
                  <div className="sx-empty"><h3>No profiles match these choices</h3></div>
                )
              ) : (
                <div className="sx-empty"><h3>Choose filters, then tap Apply to see profiles.</h3></div>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
