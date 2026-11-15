"use client";

import { PEOPLE_SORTS, type PeopleSortId } from "@/lib/desk/people-sort";
import { btnPrimary, inputClass } from "@/lib/ui/classes";

export function PeopleToolbar({ q, sort }: { q: string; sort: PeopleSortId }) {
  return (
    <form className="desk-file-search has-sort" action="/desk/people" method="get">
      <label>
        Name, member ID, or profile id
        <input name="q" className={inputClass} defaultValue={q} placeholder="Name or SL0100003" autoComplete="off" />
      </label>
      <label>
        Sort
        <select
          name="sort"
          className={inputClass}
          defaultValue={sort}
          onChange={(event) => event.currentTarget.form?.requestSubmit()}
        >
          {PEOPLE_SORTS.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </select>
      </label>
      <button className={btnPrimary} type="submit">
        Search
      </button>
    </form>
  );
}
