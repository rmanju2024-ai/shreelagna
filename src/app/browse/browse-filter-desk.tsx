"use client";

import { useEffect, useMemo, useState } from "react";
import { EMPTY_BROWSE_FILTERS, type BrowseFilters } from "@/lib/match/browse-filters";
import { listsFromSeed } from "@/lib/profile/form-lists-seed";
import { Select3d } from "@/components/select3d";
import { btnGhost, btnPrimary, inputClass } from "@/lib/ui/classes";

const SEED = listsFromSeed();

function sorted(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b, "en", { sensitivity: "base" }));
}

export function BrowseFilterDesk({
  filters,
  religions,
  communities,
  onApply,
  onClear,
}: {
  filters: BrowseFilters;
  religions: string[];
  communities: string[];
  onApply?: (next: BrowseFilters) => void;
  onClear?: () => void;
}) {
  const countries = SEED.countries;
  const states = SEED.states;
  const cities = SEED.cities;
  const lifestyles = SEED.diets;
  const educations = SEED.educations;
  const incomes = SEED.incomes;
  const [draft, setDraft] = useState<BrowseFilters>(filters);

  useEffect(() => {
    setDraft(filters);
  }, [filters]);

  const cityOptions = useMemo(
    () =>
      sorted(
        cities
          .filter((row) => (draft.state.length ? draft.state.includes(row.state) : false))
          .map((row) => row.name),
      ),
    [cities, draft.state],
  );
  const countryOptions = useMemo(() => sorted(countries), [countries]);
  const stateOptions = useMemo(() => sorted(states), [states]);
  const religionOptions = useMemo(() => sorted(religions), [religions]);
  const communityOptions = useMemo(() => sorted(communities), [communities]);

  return (
    <form
      className="sx-filter"
      onSubmit={(event) => {
        event.preventDefault();
        onApply?.(draft);
      }}
    >
      <div className="sx-filter-head">
        <div>
          <h2>Advanced filter</h2>
          <p>Pick what you want, then Apply. Age can be 18 to 80.</p>
        </div>
        <div className="sx-filter-actions">
          <button type="submit" className={btnPrimary}>
            Apply
          </button>
          <button
            type="button"
            className={btnGhost}
            onClick={() => {
              setDraft(EMPTY_BROWSE_FILTERS);
              onClear?.();
            }}
          >
            Clear
          </button>
        </div>
      </div>
      <div className="sx-fields">
        <label>
          <span>Age from</span>
          <input
            name="age_min"
            type="number"
            min={18}
            max={80}
            placeholder="18"
            value={draft.ageMin ?? ""}
            className={inputClass}
            onChange={(event) =>
              setDraft((prev) => ({
                ...prev,
                ageMin: event.target.value ? Number.parseInt(event.target.value, 10) : null,
              }))
            }
          />
        </label>
        <label>
          <span>Age to</span>
          <input
            name="age_max"
            type="number"
            min={18}
            max={80}
            placeholder="80"
            value={draft.ageMax ?? ""}
            className={inputClass}
            onChange={(event) =>
              setDraft((prev) => ({
                ...prev,
                ageMax: event.target.value ? Number.parseInt(event.target.value, 10) : null,
              }))
            }
          />
        </label>
        <label>
          <span>Residence country</span>
          <Select3d
            multiple
            name="country"
            values={draft.country}
            items={countryOptions}
            anyLabel="Any country"
            className={inputClass}
            onValuesChange={(country) => setDraft((prev) => ({ ...prev, country }))}
          />
        </label>
        <label>
          <span>Residence state</span>
          <Select3d
            multiple
            name="state"
            values={draft.state}
            items={stateOptions}
            anyLabel="Any state"
            className={inputClass}
            onValuesChange={(state) => {
              const allowed = new Set(cities.filter((row) => state.includes(row.state)).map((row) => row.name));
              setDraft((prev) => ({
                ...prev,
                state,
                city: prev.city.filter((item) => allowed.has(item)),
              }));
            }}
          />
        </label>
        <label>
          <span>Residence city</span>
          <Select3d
            multiple
            name="city"
            values={draft.city}
            items={cityOptions}
            disabled={!draft.state.length}
            anyLabel={draft.state.length ? "Any city" : "Choose a state first"}
            className={inputClass}
            onValuesChange={(city) => setDraft((prev) => ({ ...prev, city }))}
          />
        </label>
        <label>
          <span>Religion</span>
          <Select3d
            multiple
            name="religion"
            values={draft.religion}
            items={religionOptions}
            anyLabel="Any religion"
            className={inputClass}
            onValuesChange={(religion) => setDraft((prev) => ({ ...prev, religion }))}
          />
        </label>
        <label>
          <span>Community</span>
          <Select3d
            multiple
            name="community"
            values={draft.community}
            items={communityOptions}
            anyLabel="Any community"
            className={inputClass}
            onValuesChange={(community) => setDraft((prev) => ({ ...prev, community }))}
          />
        </label>
        <label>
          <span>Lifestyle</span>
          <Select3d
            multiple
            name="lifestyle"
            values={draft.lifestyle}
            items={lifestyles}
            anyLabel="Any lifestyle"
            className={inputClass}
            onValuesChange={(lifestyle) => setDraft((prev) => ({ ...prev, lifestyle }))}
          />
        </label>
        <label>
          <span>Education</span>
          <Select3d
            multiple
            name="education"
            values={draft.education}
            items={educations}
            anyLabel="Any education"
            className={inputClass}
            onValuesChange={(education) => setDraft((prev) => ({ ...prev, education }))}
          />
        </label>
        <label>
          <span>Income range</span>
          <Select3d
            multiple
            name="income"
            values={draft.income}
            items={incomes}
            anyLabel="Any income"
            className={inputClass}
            onValuesChange={(income) => setDraft((prev) => ({ ...prev, income }))}
          />
        </label>
      </div>
    </form>
  );
}
