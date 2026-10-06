"use client";

import { useMemo, useState } from "react";
import { BrowseCard, type BrowseCardNote } from "@/app/browse/browse-card";
import { BrowseFilterDesk } from "@/app/browse/browse-filter-desk";
import { DISCOVER_RESULTS_PAGE_SIZE } from "@/app/browse/browse-client";
import { EMPTY_BROWSE_FILTERS, profileFitsBrowse, type BrowseFilters } from "@/lib/match/browse-filters";
import { pageCount, pageItems } from "@/lib/match/inbox-card";
import { btnGhost } from "@/lib/ui/classes";

function fits(note: BrowseCardNote, filters: BrowseFilters): boolean {
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

export function DeskLookBoard({
  notes,
  religions,
  communities,
}: {
  notes: BrowseCardNote[];
  religions: string[];
  communities: string[];
}) {
  const [filters, setFilters] = useState<BrowseFilters>(EMPTY_BROWSE_FILTERS);
  const [applied, setApplied] = useState(false);
  const [page, setPage] = useState(1);

  const ranked = useMemo(() => (applied ? notes.filter((note) => fits(note, filters)) : []), [applied, filters, notes]);
  const pages = pageCount(ranked.length, DISCOVER_RESULTS_PAGE_SIZE);
  const currentPage = Math.min(page, pages);
  const shown = pageItems(ranked, currentPage, DISCOVER_RESULTS_PAGE_SIZE);

  return (
    <section className="desk-panel sx-results" aria-live="polite">
      <header className="desk-panel-head">
        <div>
          <p className="browse-kicker">Look</p>
          <h2>Browse with advanced filter</h2>
          <p>Same Discover filters, for both Bride and Groom. Nothing lists until you Apply.</p>
        </div>
      </header>
      <BrowseFilterDesk
        includeKind
        filters={filters}
        religions={religions}
        communities={communities}
        onApply={(next) => {
          setFilters(next);
          setPage(1);
          setApplied(true);
        }}
        onClear={() => {
          setFilters(EMPTY_BROWSE_FILTERS);
          setPage(1);
          setApplied(false);
        }}
      />
      <header className="sx-results-head">
        <p>
          {applied
            ? `${ranked.length} ${ranked.length === 1 ? "profile" : "profiles"}`
            : "Choose filters, then Apply"}
        </p>
      </header>
      {shown.length ? (
        <ul className="sx-grid is-results-list">
          {shown.map((note, index) => (
            <BrowseCard key={note.id} note={note} priority={index < 3} />
          ))}
        </ul>
      ) : (
        <div className="sx-empty">
          <h3>{applied ? "No profiles match these choices" : "Choose filters, then tap Apply to see profiles."}</h3>
        </div>
      )}
      {applied && pages > 1 ? (
        <nav className="sx-pager" aria-label="Look pages">
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
  );
}
