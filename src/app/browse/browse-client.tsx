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
export const DISCOVER_PREVIEW_LIMIT = 5;
export const DISCOVER_RESULTS_PAGE_SIZE = 10;
export const ADVANCED_FILTER_HREF = "/browse/filter";

function fitsCustom(note: BrowseCardNote, filters: BrowseFilters): boolean {
  return profileFitsBrowse(
    {
      date_of_birth: note.date_of_birth,
      profile_type: note.profile_type,
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

export function discoverResultsHref(view: BrowseView, filters: BrowseFilters = EMPTY_BROWSE_FILTERS) {
  const params = new URLSearchParams({ view });
  if (view === "custom") {
    if (filters.ageMin) params.set("age_min", String(filters.ageMin));
    if (filters.ageMax) params.set("age_max", String(filters.ageMax));
    (["kind", "country", "state", "city", "religion", "community", "lifestyle", "education", "income"] as const).forEach((key) => {
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

function FeedBanner({
  id,
  label,
  meaning,
  count,
}: {
  id: string;
  label: string;
  meaning: string;
  count?: number;
}) {
  return (
    <div className="sx-3d-banner">
      <span className="sx-star is-a" aria-hidden>✦</span>
      <span className="sx-star is-b" aria-hidden>✧</span>
      <span className="sx-star is-c" aria-hidden>✦</span>
      <div className="sx-3d-copy">
        <h2 id={id}>{label}</h2>
        <p>{meaning}</p>
      </div>
      {count != null ? <small>{count} {count === 1 ? "profile" : "profiles"}</small> : null}
    </div>
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
  const preview = notes.slice(0, DISCOVER_PREVIEW_LIMIT);
  return (
    <section className="sx-feed-row" aria-labelledby={`discover-${item.id}`}>
      <header className="sx-feed-head">
        <FeedBanner id={`discover-${item.id}`} label={item.label} meaning={item.hint} count={count} />
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
        <div className="sx-empty is-compact">
          <h3>{gate || item.empty}</h3>
        </div>
      )}
      {count > DISCOVER_PREVIEW_LIMIT ? (
        <div className="sx-view-all-center">
          <a className="sx-view-all" href={discoverResultsHref(item.id)}>
            View all {count} profiles <span aria-hidden>→</span>
          </a>
        </div>
      ) : null}
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
  filterPage = false,
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
  filterPage?: boolean;
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

  const listMode = fullResults || filterPage;
  const currentView = ALL_VIEWS.find((item) => item.id === initialView) ?? DEFAULT_VIEWS[0];
  const ranked = currentView.id === "custom" && !customApplied ? [] : rankedByView[currentView.id] ?? [];
  const pages = pageCount(ranked.length, DISCOVER_RESULTS_PAGE_SIZE);
  const currentPage = Math.min(page, pages);
  const shown = pageItems(ranked, currentPage, DISCOVER_RESULTS_PAGE_SIZE);
  const resultHref = discoverResultsHref(currentView.id, filters);
  const totalShown = PREVIEW_VIEWS.reduce((sum, item) => sum + (rankedByView[item.id]?.length ?? 0), 0);
  const discoverHref = filterPage ? "/browse" : resultHref.replace("/browse/results", "/browse");

  return (
    <div className="sx-stage">
      <header className="sx-hero">
        <div className="sx-hero-copy">
          <p className="sx-eyebrow">Search</p>
          <h1>{listMode ? currentView.label : lookingFor ? `Find your ${lookingFor}` : "Find your match"}</h1>
          {listMode ? <Link href={discoverHref} className="sx-back-to-discover">← Back to Discover</Link> : null}
        </div>
        {!notice && !listMode ? (
          <a className="sx-filter-link" href={ADVANCED_FILTER_HREF} aria-label="Open advanced filter">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
              <path d="M4 6h16M7 12h10M10 18h4" />
            </svg>
            <span>Advanced filter</span>
          </a>
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
        ) : listMode ? (
          <section className="sx-results" aria-live="polite">
            {filterPage ? (
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
            ) : null}
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
          </div>
        )}
      </div>
    </div>
  );
}
