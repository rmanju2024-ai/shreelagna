"use client";

import { useMemo, useState } from "react";
import { BrowseCard, type BrowseCardNote } from "@/app/browse/browse-card";
import { BrowseFilterDesk } from "@/app/browse/browse-filter-desk";
import { DISCOVER_RESULTS_PAGE_SIZE } from "@/app/browse/browse-client";
import { EMPTY_BROWSE_FILTERS, profileFitsBrowse, type BrowseFilters } from "@/lib/match/browse-filters";
import { pageCount, pageItems } from "@/lib/match/inbox-card";
import { ACTIVE_DAYS, activityTier } from "@/lib/match/browse-priority";
import { yearsFromDob } from "@/lib/profile/completeness";
import { btnGhost } from "@/lib/ui/classes";

export type LookSort = "newest" | "oldest" | "active" | "inactive" | "age_asc" | "age_desc" | "place" | "name";
export type LookAudience = "any" | "subscribed" | "unsubscribed";
export type LookLogin = "any" | "active" | "inactive";

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

function lastSeenMs(note: BrowseCardNote): number {
  return Date.parse(note.last_seen_at ?? "") || 0;
}

function placeKey(note: BrowseCardNote) {
  return [note.state, note.city].filter(Boolean).join(" ").toLowerCase();
}

export function noteFitsLook(
  note: BrowseCardNote,
  filters: BrowseFilters,
  extras: { audience: LookAudience; login: LookLogin },
  now = Date.now(),
): boolean {
  if (!fits(note, filters)) return false;
  if (extras.audience === "subscribed" && !note.subscribed) return false;
  if (extras.audience === "unsubscribed" && note.subscribed) return false;
  if (extras.login === "any") return true;
  const active = activityTier(note.last_seen_at, false, now) > 0;
  return extras.login === "active" ? active : !active;
}

export function sortLookNotes(notes: BrowseCardNote[], sort: LookSort): BrowseCardNote[] {
  const next = [...notes];
  next.sort((a, b) => {
    if (sort === "name") return a.name.localeCompare(b.name, "en", { sensitivity: "base" });
    if (sort === "place") return placeKey(a).localeCompare(placeKey(b), "en", { sensitivity: "base" });
    if (sort === "age_asc" || sort === "age_desc") {
      const ageA = a.date_of_birth ? yearsFromDob(a.date_of_birth) : null;
      const ageB = b.date_of_birth ? yearsFromDob(b.date_of_birth) : null;
      const left = ageA ?? (sort === "age_asc" ? 999 : -1);
      const right = ageB ?? (sort === "age_asc" ? 999 : -1);
      return sort === "age_asc" ? left - right : right - left;
    }
    if (sort === "active" || sort === "inactive") {
      const timeA = lastSeenMs(a);
      const timeB = lastSeenMs(b);
      return sort === "active" ? timeB - timeA : timeA - timeB;
    }
    const timeA = Date.parse(a.created_at ?? "") || 0;
    const timeB = Date.parse(b.created_at ?? "") || 0;
    return sort === "oldest" ? timeA - timeB : timeB - timeA;
  });
  return next;
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
  const [sort, setSort] = useState<LookSort>("newest");
  const [audience, setAudience] = useState<LookAudience>("any");
  const [login, setLogin] = useState<LookLogin>("any");
  const [applied, setApplied] = useState(false);
  const [page, setPage] = useState(1);

  const ranked = useMemo(() => {
    if (!applied) return [];
    return sortLookNotes(
      notes.filter((note) => noteFitsLook(note, filters, { audience, login })),
      sort,
    );
  }, [applied, audience, filters, login, notes, sort]);
  const pages = pageCount(ranked.length, DISCOVER_RESULTS_PAGE_SIZE);
  const currentPage = Math.min(page, pages);
  const shown = pageItems(ranked, currentPage, DISCOVER_RESULTS_PAGE_SIZE);

  return (
    <section className="desk-panel sx-results" aria-live="polite">
      <header className="desk-panel-head">
        <div>
          <p className="browse-kicker">Look</p>
          <h2>Browse with advanced filter</h2>
          <p>
            Same Discover filters, plus membership and last login. Active is a login within {ACTIVE_DAYS} days.
            Nothing lists until you Apply.
          </p>
        </div>
      </header>
      <BrowseFilterDesk
        includeKind
        sort={sort}
        onSortChange={(next) => {
          setSort(next as LookSort);
          setPage(1);
        }}
        audience={audience}
        onAudienceChange={(next) => {
          setAudience(next as LookAudience);
          setPage(1);
        }}
        login={login}
        onLoginChange={(next) => {
          setLogin(next as LookLogin);
          setPage(1);
        }}
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
          setSort("newest");
          setAudience("any");
          setLogin("any");
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
