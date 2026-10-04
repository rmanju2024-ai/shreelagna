"use client";

import Link from "next/link";
import { useMemo, useRef, useState, useTransition } from "react";
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
  {
    id: "fits",
    label: "Today’s picks",
    short: "Today",
    hint: "Curated from your preference",
    empty: "No matching profiles here yet",
  },
  {
    id: "prefers",
    label: "They like you",
    short: "They like you",
    hint: "10/15 of their preference",
    empty: "No one has you on their preference yet",
  },
  {
    id: "kundali",
    label: "Kundali match",
    short: "Kundali",
    hint: "18 or more of 36",
    empty: "No kundali matches here yet",
  },
];

const EXTRA_VIEWS: ViewItem[] = [
  {
    id: "nearby",
    label: "Nearby",
    short: "Nearby",
    hint: "Within 100 km",
    empty: "No families within 100 km yet",
  },
  {
    id: "community",
    label: "Same community",
    short: "Same community",
    hint: "Your community",
    empty: "No one from your community yet",
  },
  {
    id: "custom",
    label: "Advanced filter",
    short: "Advanced filter",
    hint: "Age, city, community",
    empty: "No profiles match these choices",
  },
];

const ALL_VIEWS = [...DEFAULT_VIEWS, ...EXTRA_VIEWS];

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

function notesFor(
  catalog: Record<string, BrowseCardNote>,
  rows: BrowseScoreRow[] | undefined,
): BrowseCardNote[] {
  const out: BrowseCardNote[] = [];
  for (const row of rows ?? []) {
    const card = catalog[row.id];
    if (!card) continue;
    out.push(row.score ? { ...card, score: row.score } : card);
  }
  return out;
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
  const [view, setView] = useState<BrowseView>(initialView);
  const [filters, setFilters] = useState<BrowseFilters>(
    initialView === "custom" ? initialFilters : EMPTY_BROWSE_FILTERS,
  );
  const [page, setPage] = useState(1);
  const [pending, startTransition] = useTransition();
  const [customApplied, setCustomApplied] = useState(initialView === "custom" && JSON.stringify(initialFilters) !== JSON.stringify(EMPTY_BROWSE_FILTERS));
  const tabsRef = useRef<HTMLElement>(null);

  const ranked = useMemo(() => {
    const rows = notesFor(catalog, lists[view]);
    if (view !== "custom") return rows;
    if (!customApplied) return [];
    return rows.filter((note) => fitsCustom(note, filters));
  }, [catalog, lists, view, filters, customApplied]);

  const counts = useMemo(() => {
    const tally: Record<BrowseView, number> = {
      fits: 0,
      prefers: 0,
      kundali: 0,
      nearby: 0,
      community: 0,
      custom: 0,
    };
    (Object.keys(tally) as BrowseView[]).forEach((key) => {
      tally[key] =
        key === "custom"
          ? customApplied ? notesFor(catalog, lists.custom).filter((note) => fitsCustom(note, filters)).length : 0
          : (lists[key] ?? []).length;
    });
    return tally;
  }, [catalog, lists, filters, customApplied]);

  const pages = fullResults ? pageCount(ranked.length, 10) : 1;
  const currentPage = Math.min(page, pages);
  const shown = fullResults ? pageItems(ranked, currentPage, 10) : ranked.slice(0, 5);
  const currentView = ALL_VIEWS.find((item) => item.id === view) ?? DEFAULT_VIEWS[0];
  const gate = viewNotes?.[view];

  function chooseView(next: BrowseView) {
    startTransition(() => {
      setView(next);
      setPage(1);
      if (next === "custom") setCustomApplied(false);
    });
  }

  function viewButton(item: ViewItem) {
    return (
      <button
        key={item.id}
        type="button"
        aria-current={view === item.id ? "page" : undefined}
        className={`sx-tab${view === item.id ? " is-on" : ""}`}
        onClick={(event) => {
          chooseView(item.id);
          event.currentTarget.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
        }}
      >
        <b>{item.short}</b>
        <em>{counts[item.id]}</em>
      </button>
    );
  }

  const resultHref = (() => {
    const params = new URLSearchParams({ view });
    if (view === "custom") {
      if (filters.ageMin) params.set("age_min", String(filters.ageMin));
      if (filters.ageMax) params.set("age_max", String(filters.ageMax));
      const keys = ["country", "state", "city", "religion", "community", "lifestyle", "education", "income"] as const;
      keys.forEach((key) => { if (filters[key].length) params.set(key, filters[key].join(",")); });
    }
    return `/browse/results?${params}`;
  })();

  return (
    <div className="sx-stage">
      <header className="sx-hero">
        <div>
          <p className="sx-eyebrow">Search</p>
          <h1>{fullResults ? currentView.label : lookingFor ? `Find your ${lookingFor}` : "Find your match"}</h1>
        </div>
        {!notice ? (
          <p className="sx-hero-count">
            <b>{counts[view]}</b>
            <span>{counts[view] === 1 ? "profile" : "profiles"}</span>
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
        {!fullResults ? <div className="sx-tab-shell">
          <button
            type="button"
            className="sx-tab-scroll is-left"
            aria-label="Show previous Discover options"
            onClick={() => tabsRef.current?.scrollBy({ left: -260, behavior: "smooth" })}
          >
            ‹
          </button>
          <nav className="sx-tabs" aria-label="Match lists" ref={tabsRef}>
            {ALL_VIEWS.map(viewButton)}
          </nav>
          <button
            type="button"
            className="sx-tab-scroll is-right"
            aria-label="Show more Discover options"
            onClick={() => tabsRef.current?.scrollBy({ left: 260, behavior: "smooth" })}
          >
            ›
          </button>
        </div> : null}

        {view === "custom" && !notice ? (
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

        {notice ? (
          <div className={`${cardClass} browse-gate`}>
            <p className="browse-kicker">Members only</p>
            <h2>Begin with a profile</h2>
            <p>{notice}</p>
            <div className="browse-panel-actions">
              {user ? (
                <Link href="/app/profiles/new" className={btnPrimary}>
                  Create a profile
                </Link>
              ) : (
                <Link href="/login" className={btnPrimary}>
                  Sign in with Gmail
                </Link>
              )}
              <Link href="/contact" className={btnGhost}>
                Write to us
              </Link>
            </div>
          </div>
        ) : (
          <section className="sx-results" aria-live="polite" data-pending={pending || undefined}>
            <header className="sx-results-head">
              <p>
                {ranked.length} {ranked.length === 1 ? "profile" : "profiles"} · {currentView.hint}
              </p>
            </header>
            {gate && shown.length ? <p className="sx-note">{gate}</p> : null}
            {shown.length ? (
              <ul className={`sx-grid${fullResults ? " is-results-list" : ""}`}>
                {shown.map((note, index) => (
                  <BrowseCard key={`${view}-${note.id}`} note={note} priority={index < 3} />
                ))}
              </ul>
            ) : (
              <div className="sx-empty">
                <h3>{gate || (view === "custom" && !customApplied ? "Choose filters, then tap Apply to see profiles." : currentView.empty)}</h3>
              </div>
            )}
            {!fullResults && ranked.length > 5 ? (
              <Link className="sx-view-all" href={resultHref}>
                View all {ranked.length} profiles <span aria-hidden>→</span>
              </Link>
            ) : null}
            {pages > 1 ? (
              <nav className="sx-pager" aria-label="Search pages">
                {currentPage > 1 ? (
                  <button type="button" className={btnGhost} onClick={() => setPage(currentPage - 1)}>
                    Previous
                  </button>
                ) : (
                  <span />
                )}
                <p>
                  Page {currentPage} of {pages}
                </p>
                {currentPage < pages ? (
                  <button type="button" className={btnGhost} onClick={() => setPage(currentPage + 1)}>
                    Next
                  </button>
                ) : (
                  <span />
                )}
              </nav>
            ) : null}
          </section>
        )}
      </div>
    </div>
  );
}
