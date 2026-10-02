"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { FieldHelp } from "@/app/app/profiles/field-help";
import { Select3d } from "@/components/select3d";
import { citiesForState, type FormLists } from "@/lib/profile/form-lists";
import { isIndiaNative } from "@/lib/profile/options";
import { btnHero, inputClass } from "@/lib/ui/classes";

export function PlaceBlock({
  title,
  countryName,
  stateName,
  cityName,
  country,
  state,
  city,
  lists,
  onCountry,
  onState,
  onCity,
  cityRequired = false,
}: {
  title: string;
  countryName: string;
  stateName: string;
  cityName: string;
  country: string;
  state: string;
  city: string;
  lists: FormLists;
  onCountry: (value: string) => void;
  onState: (value: string) => void;
  onCity: (value: string) => void;
  cityRequired?: boolean;
}) {
  const india = isIndiaNative(country);
  const cities = citiesForState(lists, state);
  return (
    <div className="place-block">
      <p className="place-block-title">{title}</p>
      <Field
        className={india ? "" : "sm:col-span-2"}
        label="Country"
        help={
          title.startsWith("Native")
            ? "The country the family considers home. State and city appear only for India."
            : "Where they live now. State and city appear only for India."
        }
      >
        <Select3d
          name={countryName}
          required
          value={country}
          onChange={(e) => {
            const next = e.target.value;
            onCountry(next);
            if (!isIndiaNative(next)) {
              onState("");
              onCity("");
              return;
            }
            const nextState = state && lists.states.includes(state) ? state : "";
            const nextCities = citiesForState(lists, nextState);
            onState(nextState);
            onCity(nextCities.includes(city) ? city : "");
          }}
          className={inputClass}
        >
          {lists.countries.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </Select3d>
        {!india ? (
          <p className="mt-2 text-sm font-normal text-[var(--muted)]">
            Add town or region in About, if you wish.
          </p>
        ) : null}
      </Field>
      {india ? (
        <>
          <Field label="State">
            <Select3d
              name={stateName}
              required
              value={state}
              onChange={(e) => {
                const next = e.target.value;
                onState(next);
                const nextCities = citiesForState(lists, next);
                onCity(nextCities.includes(city) ? city : "");
              }}
              className={inputClass}
            >
              <option value="">Select</option>
              {lists.states.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </Select3d>
          </Field>
          <Field label="City" required={cityRequired}>
            <Select3d
              name={cityName}
              required
              value={city}
              onChange={(e) => onCity(e.target.value)}
              className={inputClass}
            >
              <option value="">Select</option>
              {cities.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </Select3d>
          </Field>
        </>
      ) : null}
    </div>
  );
}

export function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={btnHero} disabled={pending}>
      {pending ? "Saving…" : "Save"}
    </button>
  );
}

export function Field({
  label,
  help,
  required = false,
  className = "",
  children,
}: {
  label: string;
  help?: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`field-3d ${className}`}>
      <span className="field-3d-label">
        {label}
        {required ? (
          <span className="field-star" aria-hidden>
            *
          </span>
        ) : null}
        {help ? <FieldHelp text={help} /> : null}
      </span>
      {children}
    </div>
  );
}

export function SiblingCounts({
  label,
  marriedLabel,
  totalName,
  marriedName,
  totalDefault,
  marriedDefault,
}: {
  label: string;
  marriedLabel: string;
  totalName: string;
  marriedName: string;
  totalDefault?: number | null;
  marriedDefault?: number | null;
}) {
  const [total, setTotal] = useState(String(totalDefault ?? 0));
  const n = Number(total) || 0;
  const canMarry = n > 0;
  const [married, setMarried] = useState(() => {
    if (!canMarry) return "0";
    return String(Math.min(marriedDefault ?? 0, n));
  });

  return (
    <>
      <Field label={label}>
        <Select3d
          name={totalName}
          value={total}
          onChange={(e) => {
            const next = e.target.value;
            const cap = Number(next) || 0;
            setTotal(next);
            if (!cap) setMarried("0");
            else if (Number(married) > cap) setMarried(String(cap));
          }}
          className={inputClass}
        >
          {Array.from({ length: 13 }, (_, i) => i).map((count) => (
            <option key={count} value={count}>
              {count}
            </option>
          ))}
        </Select3d>
      </Field>
      <Field label={marriedLabel}>
        {canMarry ? (
          <Select3d
            name={marriedName}
            value={married}
            onChange={(e) => setMarried(e.target.value)}
            className={inputClass}
          >
            {Array.from({ length: n + 1 }, (_, i) => i).map((count) => (
              <option key={count} value={count}>
                {count}
              </option>
            ))}
          </Select3d>
        ) : (
          <>
            <input type="hidden" name={marriedName} value="0" />
            <Select3d value="0" disabled className={`${inputClass} field-locked`}>
              <option value="0">0</option>
            </Select3d>
          </>
        )}
      </Field>
    </>
  );
}
