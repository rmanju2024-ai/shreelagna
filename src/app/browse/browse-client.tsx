"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { BrowseCard, type BrowseCardNote } from "@/app/browse/browse-card";
import { BrowseFilterDesk } from "@/app/browse/browse-filter-desk";
import { EMPTY_BROWSE_FILTERS, profileFitsBrowse, type BrowseFilters } from "@/lib/match/browse-filters";
import { type BrowseScoreRow, type BrowseView } from "@/lib/match/browse-match";
import { pageCount, pageItems, PROFILE_PAGE_SIZE } from "@/lib/match/inbox-card";
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
    label: "Best match",
    short: "Best match",
    hint: "10/15 of your preference",
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
    id: "viewed_you",
    label: "Who viewed you",
    short: "Who viewed you",
    hint: "They opened your profile",
    empty: "No one has viewed your profile yet",
  },
  {
    id: "you_viewed",
    label: "You viewed",
    short: "You viewed",
    hint: "Profiles you opened",
    empty: "You have not opened other profiles yet",
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
}) {
  const [view, setView] = useState<BrowseView>(initialView);
  const [filters, setFilters] = useState<BrowseFilters>(
    initialView === "custom" ? initialFilters : EMPTY_BROWSE_FILTERS,
  );
  const [page, setPage] = useState(1);

  const ranked = useMemo(() => {
    const rows = notesFor(catalog, lists[view]);
    if (view !== "custom") return rows;
    return rows.filter((note) => fitsCustom(note, filters));
  }, [catalog, lists, view, filters]);

  const counts = useMemo(() => {
    const tally: Record<BrowseView, number> = {
      fits: 0,
      prefers: 0,
      kundali: 0,
      nearby: 0,
      community: 0,
      viewed_you: 0,
      you_viewed: 0,
      custom: 0,
    };
    (Object.keys(tally) as BrowseView[]).forEach((key) => {
      tally[key] =
        key === "custom"
          ? notesFor(catalog, lists.custom).filter((note) => fitsCustom(note, filters)).length
          : (lists[key] ?? []).length;
    });
    return tally;
  }, [catalog, lists, filters]);

  const pages = pageCount(ranked.length);
  const currentPage = Math.min(page, pages);
  const shown = pageItems(ranked, currentPage);
  const currentView = ALL_VIEWS.find((item) => item.id === view) ?? DEFAULT_VIEWS[0];
  const gate = viewNotes?.[view];

  function chooseView(next: BrowseView) {
    setView(next);
    setPage(1);
  }

  function viewButton(item: ViewItem) {
    return (
      <button
        key={item.id}
        type="button"
        aria-current={view === item.id ? "page" : undefined}
        className={`browse-view${view === item.id ? " is-on" : ""}`}
        onClick={() => chooseView(item.id)}
      >
        <span>
          <b>{item.short}</b>
          <small>{item.hint}</small>
        </span>
        <em>{counts[item.id]}</em>
      </button>
    );
  }

  return (
    <div className="browse-stage">
      <header className="browse-hero">
        <h1>{lookingFor ? `Looking for ${lookingFor}` : "Search matches"}</h1>
      </header>

      {view === "custom" && !notice ? (
        <BrowseFilterDesk
          filters={filters}
          religions={religions}
          communities={communities}
          onApply={(next) => {
            setFilters(next);
            setPage(1);
          }}
          onClear={() => {
            setFilters(EMPTY_BROWSE_FILTERS);
            setPage(1);
          }}
        />
      ) : null}

      {error === "need_profile" ? (
        <p className="browse-flash is-warn">Create and activate a profile before sending interest.</p>
      ) : null}
      {error === "unavailable" ? (
        <p className="browse-flash is-warn">That profile is hidden or no longer available.</p>
      ) : null}

      <div className="browse-board">
        <nav className="browse-views browse-chip-row" aria-label="Match lists">
          {[...DEFAULT_VIEWS, ...EXTRA_VIEWS].map(viewButton)}
        </nav>

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
          <section className="browse-results" aria-live="polite">
            <header className="browse-results-head">
              <div>
                <p className="browse-kicker">{currentView.label}</p>
                <h2>{lookingFor ?? "Matches"}</h2>
              </div>
              <p>
                {ranked.length} {ranked.length === 1 ? "profile" : "profiles"}
                <span> · {PROFILE_PAGE_SIZE} on a page</span>
              </p>
            </header>
            {gate && shown.length ? <p className="browse-saved-note">{gate}</p> : null}
            {shown.length ? (
              <ul className="browse-list">
                {shown.map((note) => (
                  <BrowseCard key={`${view}-${note.id}`} note={note} />
                ))}
              </ul>
            ) : (
              <div className="browse-empty">
                <div className="gold-ornament" />
                <h3>{gate || currentView.empty}</h3>
              </div>
            )}
            {pages > 1 ? (
              <nav className="inbox-pager" aria-label="Search pages">
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
