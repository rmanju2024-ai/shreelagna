"use client";

import { useMemo, useState } from "react";
import { compareLabel } from "@/lib/profile/form-lists";

export function MultiCheck({
  name,
  options,
  selected = [],
  columns = 2,
  compact = false,
  anyValue,
}: {
  name: string;
  options: { value: string; label: string }[] | string[];
  selected?: string[] | null;
  columns?: 2 | 3;
  compact?: boolean;
  anyValue?: string;
}) {
  const seen = new Set<string>();
  const items = options
    .map((o) => (typeof o === "string" ? { value: o, label: o } : o))
    .filter((item) => {
      if (seen.has(item.value)) return false;
      seen.add(item.value);
      return true;
    })
    .sort((a, b) => compareLabel(a.label, b.label));
  const start = selected?.length ? [...new Set(selected)] : anyValue ? [anyValue] : [];
  const [picked, setPicked] = useState<string[]>(start);

  function toggle(value: string) {
    setPicked((cur) => {
      const on = cur.includes(value);
      if (anyValue && value === anyValue) return on && cur.length === 1 ? cur : [anyValue];
      const next = on ? cur.filter((v) => v !== value) : [...cur.filter((v) => v !== anyValue), value];
      return next.length ? next : anyValue ? [anyValue] : next;
    });
  }

  return (
    <div className={`multi-check multi-check-${columns}${compact ? " is-compact" : ""}`}>
      {items.map((item) => (
        <label key={item.value}>
          <input
            type="checkbox"
            name={name}
            value={item.value}
            checked={picked.includes(item.value)}
            onChange={() => toggle(item.value)}
          />
          <span>{item.label}</span>
        </label>
      ))}
    </div>
  );
}

export function PrefPlaceChecks({
  lists,
  selectedStates = [],
  selectedCities = [],
}: {
  lists: FormLists;
  selectedStates?: string[] | null;
  selectedCities?: string[] | null;
}) {
  const [states, setStates] = useState<string[]>(selectedStates ?? []);
  const cities = useMemo(() => {
    const names = lists.cities.filter((c) => states.includes(c.state)).map((c) => c.name);
    return [...new Set(names)];
  }, [lists.cities, states]);

  return (
    <>
      <div className="field-3d sm:col-span-2">
        <span>States hoped for (several may be chosen)</span>
        <div className="multi-check multi-check-3">
          {lists.states.map((s) => {
            const on = states.includes(s);
            return (
              <label key={s}>
                <input
                  type="checkbox"
                  name="pref_states"
                  value={s}
                  checked={on}
                  onChange={() =>
                    setStates((cur) => (on ? cur.filter((x) => x !== s) : [...cur, s]))
                  }
                />
                <span>{s}</span>
              </label>
            );
          })}
        </div>
      </div>
      <div className="field-3d sm:col-span-2">
        <span>Cities hoped for (several may be chosen)</span>
        {cities.length ? (
          <div className="multi-check multi-check-3">
            {cities.map((c) => (
              <label key={c}>
                <input
                  type="checkbox"
                  name="pref_cities"
                  value={c}
                  defaultChecked={(selectedCities ?? []).includes(c)}
                />
                <span>{c}</span>
              </label>
            ))}
          </div>
        ) : (
          <p className="mt-2 text-sm text-[var(--muted)]">Tick one or more states first, then cities will appear.</p>
        )}
      </div>
    </>
  );
}

