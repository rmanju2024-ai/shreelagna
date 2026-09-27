"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { saveProfile } from "@/app/app/profiles/actions";
import { BirthDatePicker, BirthTimePicker } from "@/app/app/profiles/birth-date-picker";
import {
  creatorRolesForForm,
  HOPE_ANY,
  isIndiaNative,
  LIVING_ARRANGEMENTS,
  PROFILE_FORM_DEFAULTS,
  SETTLE_ABROAD,
} from "@/lib/profile/options";
import { citiesForState, pickListed, sortLabels, type FormLists } from "@/lib/profile/form-lists";
import { asStringList, hopeValues, languagesKnown } from "@/lib/profile/multi-values";
import { FieldHelp } from "@/app/app/profiles/field-help";
import { HopePicker } from "@/app/app/profiles/hope-picker";
import Link from "next/link";
import { Select3d } from "@/components/select3d";
import { btnHero, btnHeroGhost, inputClass } from "@/lib/ui/classes";
import { type ProfileEditSection } from "@/lib/profile/sections";
import { AboutEditor } from "@/app/app/profiles/about-editor";
import { MobileOtpField } from "@/app/app/profiles/mobile-otp-field";
import { ABOUT_MAX, ABOUT_MIN, FAMILY_NOTE_MAX } from "@/lib/profile/about-html";

export type ProfileFormValues = {
  id?: string;
  creator_relationship?: string;
  profile_type?: string;
  subject_full_name?: string;
  surname?: string | null;
  date_of_birth?: string;
  birth_time?: string | null;
  mother_tongue?: string | null;
  height_cm?: number | null;
  marital_status?: string | null;
  diet?: string | null;
  native_country?: string | null;
  native_state?: string | null;
  native_city?: string | null;
  current_city?: string | null;
  current_state?: string | null;
  qualification?: string | null;
  occupation?: string | null;
  employed_in?: string | null;
  income_band?: string | null;
  employer_name?: string | null;
  settle_abroad?: string | null;
  future_ambition?: string | null;
  family_type?: string | null;
  birth_city?: string | null;
  college_name?: string | null;
  hobbies?: string | null;
  brothers_count?: number | null;
  brothers_married_count?: number | null;
  sisters_count?: number | null;
  sisters_married_count?: number | null;
  father_name?: string | null;
  father_occupation?: string | null;
  mother_name?: string | null;
  mother_occupation?: string | null;
  siblings_note?: string | null;
  family_status?: string | null;
  family_location?: string | null;
  physical_status?: string | null;
  health_notes?: string | null;
  sub_community?: string | null;
  blood_group?: string | null;
  grew_up_in?: string | null;
  living_arrangement?: string | null;
  gotra?: string | null;
  rashi?: string | null;
  lagna?: string | null;
  nakshatra?: string | null;
  nakshatra_pada?: string | null;
  gana?: string | null;
  yoni_animal?: string | null;
  manglik?: string | null;
  citizenship?: string | null;
  pin_code?: string | null;
  current_country?: string | null;
  hobby_list?: string[] | null;
  pref_age_min?: number | null;
  pref_age_max?: number | null;
  pref_marital?: string | string[] | null;
  pref_maritals?: string[] | null;
  pref_education?: string | string[] | null;
  pref_educations?: string[] | null;
  pref_occupation?: string | string[] | null;
  pref_occupations?: string[] | null;
  pref_country?: string | string[] | null;
  pref_countries?: string[] | null;
  pref_notes?: string | null;
  known_languages?: string[] | null;
  pref_tongues?: string[] | null;
  pref_religions?: string[] | null;
  pref_communities?: string[] | null;
  pref_state?: string | string[] | null;
  pref_states?: string[] | null;
  pref_cities?: string[] | null;
  pref_height_min?: number | null;
  pref_height_max?: number | null;
  pref_diets?: string[] | null;
  pref_incomes?: string[] | null;
  pref_employed?: string[] | null;
  pref_managed?: string[] | null;
  pref_gothra?: string[] | null;
  pref_horoscope?: string | null;
  about?: string | null;
  religion_id?: string | null;
  community_id?: string | null;
  prefer_not_community?: boolean;
  subject_mobile?: string | null;
  phone_otp_verified_at?: string | null;
  member_code?: string | null;
};

function PlaceBlock({
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

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={btnHero} disabled={pending}>
      {pending ? "Saving…" : "Save"}
    </button>
  );
}

function Field({
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

function SiblingCounts({
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

export function ProfileForm({
  values,
  religions,
  communities,
  lists,
  error,
  mode = "create",
  section,
  loginEmail,
  hasVideo: _hasVideo = false,
  hasAudio: _hasAudio = false,
  cancelHref,
  omitAbout = false,
  allowMobileOtp = true,
}: {
  values?: ProfileFormValues;
  religions: { id: string; name: string }[];
  communities: { id: string; name: string; religion_id: string }[];
  lists: FormLists;
  error?: string;
  mode?: "create" | "edit";
  section?: ProfileEditSection;
  loginEmail?: string;
  hasVideo?: boolean;
  hasAudio?: boolean;
  cancelHref?: string;
  omitAbout?: boolean;
  allowMobileOtp?: boolean;
}) {
  const d = PROFILE_FORM_DEFAULTS;
  const roles = creatorRolesForForm(values?.creator_relationship);
  const type = values?.profile_type;
  const [who, setWho] = useState(values?.creator_relationship ?? "self");
  const [poster, setPoster] = useState(who === "self" ? "self" : "family");
  const familyRoles = roles.filter((r) => r.value !== "self");
  const [nativeCountry, setNativeCountry] = useState(
    pickListed(lists.countries, values?.native_country ?? "India"),
  );
  const defaultNativeState =
    values?.native_state && lists.states.includes(values.native_state) ? values.native_state : "";
  const [nativeState, setNativeState] = useState(defaultNativeState);
  const [nativeCity, setNativeCity] = useState(() => {
    const cities = citiesForState(lists, defaultNativeState);
    const preferred = values?.native_city ?? "";
    return preferred && cities.includes(preferred) ? preferred : "";
  });
  const [currentCountry, setCurrentCountry] = useState(
    pickListed(lists.countries, values?.current_country ?? values?.native_country ?? "India"),
  );
  const defaultCurrentState =
    values?.current_state && lists.states.includes(values.current_state) ? values.current_state : "";
  const [currentState, setCurrentState] = useState(defaultCurrentState);
  const [currentCity, setCurrentCity] = useState(() => {
    const cities = citiesForState(lists, defaultCurrentState);
    const preferred = values?.current_city ?? "";
    return preferred && cities.includes(preferred) ? preferred : "";
  });
  const [samePlace, setSamePlace] = useState(() => {
    if (!values) return true;
    const nCountry = values.native_country || "India";
    const cCountry = values.current_country || nCountry;
    const nState = values.native_state || "";
    const cState = values.current_state || nState;
    const nCity = values.native_city || values.current_city || "";
    const cCity = values.current_city || nCity;
    return nCountry === cCountry && nState === cState && nCity === cCity;
  });
  const initialPrefStates = hopeValues(values, "pref_states", "pref_state");
  const [prefStates, setPrefStates] = useState(
    initialPrefStates.length ? initialPrefStates : [HOPE_ANY.state],
  );
  const anyPrefState = prefStates.includes(HOPE_ANY.state) || prefStates.length === 0;
  const prefCityOptions = anyPrefState
    ? []
    : [...new Set(lists.cities.filter((c) => prefStates.includes(c.state)).map((c) => c.name))];
  const faiths = [...religions].sort((a, b) => a.name.localeCompare(b.name, "en", { sensitivity: "base" }));
  const [religionId, setReligionId] = useState(values?.religion_id ?? "");
  const communityChoices = communities.filter((c) => c.religion_id === religionId);
  const casteNames = sortLabels([...new Set(communities.map((c) => c.name))]);
  const self = who === "self";
  const aboutDefault = values?.about ?? "";
  const show = (id: ProfileEditSection) => (!omitAbout || id !== "about") && (!section || section === id);

  return (
    <form action={saveProfile} className="form-3d" autoComplete="off">
      {values?.id ? <input type="hidden" name="id" value={values.id} /> : null}
      {values?.member_code ? <input type="hidden" name="member_code" value={values.member_code} /> : null}
      {section ? <input type="hidden" name="section" value={section} /> : null}
      {mode === "edit" && values?.member_code ? (
        <p className="rounded-xl border border-[var(--gold)]/40 bg-[#fff8ef] px-4 py-3 text-sm">
          Editing profile <strong className="tracking-wider">{values.member_code}</strong>
        </p>
      ) : null}
      {mode === "create" && values?.member_code ? (
        <p className="rounded-xl border border-[var(--gold)]/40 bg-[#fff8ef] px-4 py-3 text-sm">
          Member ID <strong className="tracking-wider">{values.member_code}</strong>
        </p>
      ) : null}
      {error ? (
        <p className="rounded-xl border border-red-200 bg-white px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      ) : null}

      {mode === "edit" ? <input type="hidden" name="creator_relationship" value={who} /> : null}

      {show("family") && mode !== "edit" ? (
      <section className="form-3d-panel">
        <p className="form-3d-kicker">Step one</p>
        <h2 className="form-3d-title">Who is creating this profile?</h2>
        <div className="gold-ornament" />
        <p className="mt-3 text-sm text-[var(--muted)]">
          Self means the bride or groom is writing. Family means a parent, sister, brother, or
          guardian is writing on their behalf.
        </p>
        <div className="choice-3d-grid mt-6">
          <label className="choice-3d choice-3d-wide">
            <input
              type="radio"
              name="poster_kind"
              checked={poster === "self"}
              onChange={() => {
                setPoster("self");
                setWho("self");
              }}
            />
            <strong>Self</strong>
            <em>I am the bride or groom</em>
          </label>
          <label className="choice-3d choice-3d-wide">
            <input
              type="radio"
              name="poster_kind"
              checked={poster === "family"}
              onChange={() => {
                setPoster("family");
                setWho((cur) => (cur === "self" ? "parent" : cur));
              }}
            />
            <strong>Family</strong>
            <em>Posted by parent, sister, brother, or guardian</em>
          </label>
        </div>
        {poster === "self" ? <input type="hidden" name="creator_relationship" value="self" /> : null}
        {poster === "family" ? (
          <div className="choice-3d-grid mt-5">
            {familyRoles.map((r) => (
              <label key={r.value} className="choice-3d">
                <input
                  type="radio"
                  name="creator_relationship"
                  value={r.value}
                  required
                  checked={who === r.value}
                  onChange={() => setWho(r.value)}
                />
                <strong>{r.label}</strong>
                <em>{r.hint}</em>
              </label>
            ))}
          </div>
        ) : null}
      </section>
      ) : null}

      {show("personal") ? (
      <section className="form-3d-panel">
        <p className="form-3d-kicker">{mode === "edit" ? "Details" : "Step two"}</p>
        <h2 className="form-3d-title">{self ? "Your details" : "Bride or groom"}</h2>
        <div className="gold-ornament" />
        {mode === "edit" && (type === "vadhu" || type === "vara") ? (
          <>
            <input type="hidden" name="profile_type" value={type} />
            <div className="choice-3d-grid">
              <div className="choice-3d choice-3d-wide is-locked">
                <strong>{type === "vara" ? "Groom" : "Bride"}</strong>
                <em>Chosen at registration and cannot be changed</em>
              </div>
            </div>
          </>
        ) : (
        <div className="choice-3d-grid">
          <label className="choice-3d choice-3d-wide">
            <input
              type="radio"
              name="profile_type"
              value="vadhu"
              required
              defaultChecked={type === "vadhu"}
            />
            <strong>Bride</strong>
            <em>{self ? "I am the bride" : "A bride’s profile"}</em>
          </label>
          <label className="choice-3d choice-3d-wide">
            <input
              type="radio"
              name="profile_type"
              value="vara"
              required
              defaultChecked={type === "vara"}
            />
            <strong>Groom</strong>
            <em>{self ? "I am the groom" : "A groom’s profile"}</em>
          </label>
        </div>
        )}
        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <Field label={self ? "Your full name" : "Their full name"} required className="sm:col-span-2">
            <input
              name="subject_full_name"
              required
              minLength={2}
              maxLength={120}
              defaultValue={values?.subject_full_name ?? ""}
              className={inputClass}
            />
          </Field>
          <Field label="Gharane / Surname" required>
            <input
              name="surname"
              required
              minLength={1}
              maxLength={80}
              placeholder="Family name or gharane"
              defaultValue={values?.surname ?? ""}
              className={inputClass}
            />
          </Field>
          <Field label="Blood group">
            <Select3d name="blood_group" defaultValue={values?.blood_group ?? ""} className={inputClass}>
              <option value="">Not mentioned</option>
              {lists.bloodGroups.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </Select3d>
          </Field>
          <Field label="Height (cm)" required>
            <Select3d
              name="height_cm"
              required
              defaultValue={values?.height_cm ? String(values.height_cm) : ""}
              className={inputClass}
            >
              <option value="">Select</option>
              {lists.heights.map((h) => (
                <option key={h} value={h}>
                  {h} cm
                </option>
              ))}
            </Select3d>
          </Field>
          <Field
            label="Mother tongue"
            help="The first language of the home. Other languages can be listed separately below."
          >
            <Select3d
              name="mother_tongue"
              required
              defaultValue={values?.mother_tongue ?? ""}
              className={inputClass}
            >
              <option value="">Select</option>
              {lists.tongues.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </Select3d>
          </Field>
          <HopePicker
            className="sm:col-span-2"
            label="Languages known"
            help="Languages they can speak or read, besides the mother tongue."
            name="known_languages"
            options={lists.tongues}
            selected={languagesKnown(values)}
          />
          <Field label="Marital status" required>
            <Select3d
              name="marital_status"
              required
              defaultValue={values?.marital_status ?? ""}
              className={inputClass}
            >
              <option value="">Select</option>
              {lists.marital.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </Select3d>
          </Field>
          <Field
            label="Mobile"
            required
            help="We send a WhatsApp code. No SMS."
          >
            <MobileOtpField
              profileId={allowMobileOtp ? values?.id : undefined}
              defaultMobile={values?.subject_mobile ?? ""}
              verified={Boolean(values?.phone_otp_verified_at)}
              staffView={!allowMobileOtp}
            />
          </Field>
          <Field
            label="Email ID"
            help="This is the Gmail you signed in with. It cannot be changed here."
          >
            <input
              type="email"
              readOnly
              tabIndex={-1}
              aria-readonly="true"
              value={loginEmail ?? ""}
              className={`${inputClass} field-locked`}
            />
          </Field>
        </div>
      </section>
      ) : null}

      {show("personal") || show("work") ? (
      <section className="form-3d-panel">
        <p className="form-3d-kicker">
          {section === "work" ? "Education & work" : section === "personal" ? "Place" : mode === "edit" ? "Home and vocation" : "Step three"}
        </p>
        <h2 className="form-3d-title">
          {section === "work" ? "Education and work" : section === "personal" ? "Native place and residence" : "Home and vocation"}
        </h2>
        <div className="gold-ornament" />
        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          {show("personal") ? (
          <>
          <Field
            label="Grew up in"
            help="The country or place where they spent their childhood — it may differ from where they live now."
            className="sm:col-span-2"
          >
            <input
              name="grew_up_in"
              maxLength={80}
              placeholder="Country or place they grew up"
              defaultValue={values?.grew_up_in ?? ""}
              className={inputClass}
            />
          </Field>
          <div className="sm:col-span-2 grid gap-5">
            <PlaceBlock
              title="Native place"
              countryName="native_country"
              stateName="native_state"
              cityName="native_city"
              country={nativeCountry}
              state={nativeState}
              city={nativeCity}
              lists={lists}
              onCountry={setNativeCountry}
              onState={setNativeState}
              onCity={setNativeCity}
              cityRequired={samePlace && isIndiaNative(nativeCountry)}
            />
            <label className="place-same">
              <input
                type="checkbox"
                checked={samePlace}
                onChange={(e) => {
                  const on = e.target.checked;
                  setSamePlace(on);
                  if (!on) {
                    setCurrentCountry(nativeCountry);
                    setCurrentState(nativeState);
                    setCurrentCity(nativeCity);
                  }
                }}
              />
              Native place is the same as current residence
            </label>
            {samePlace ? (
              <div className="place-block">
                <p className="place-block-title">Current residence</p>
                <p className="sm:col-span-2 m-0 text-sm text-[var(--muted)]">
                  Matches native place.
                </p>
                <input type="hidden" name="current_country" value={nativeCountry} />
                {isIndiaNative(nativeCountry) ? (
                  <>
                    <input type="hidden" name="current_state" value={nativeState} />
                    <input type="hidden" name="current_city" value={nativeCity} />
                  </>
                ) : null}
              </div>
            ) : (
              <PlaceBlock
                title="Current residence"
                countryName="current_country"
                stateName="current_state"
                cityName="current_city"
                country={currentCountry}
                state={currentState}
                city={currentCity}
                lists={lists}
                onCountry={setCurrentCountry}
                onState={setCurrentState}
                onCity={setCurrentCity}
                cityRequired={isIndiaNative(currentCountry)}
              />
            )}
          </div>
          <Field
            label="Residency status"
            help="How they stay in the country of residence — citizen, visa, or another arrangement."
          >
            <Select3d name="citizenship" defaultValue={values?.citizenship ?? ""} className={inputClass}>
              <option value="">Not mentioned</option>
              {lists.residency.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </Select3d>
          </Field>
          <Field
            label="Living arrangement"
            help="Whether they stay in their own house, with parents, or in a rented or leased home."
          >
            <Select3d name="living_arrangement" defaultValue={values?.living_arrangement ?? ""} className={inputClass}>
              <option value="">Not mentioned</option>
              {LIVING_ARRANGEMENTS.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </Select3d>
          </Field>
          </>
          ) : null}
          {show("work") ? (
          <>
          <Field label="Highest education" required>
            <Select3d
              name="qualification"
              required
              defaultValue={values?.qualification ?? ""}
              className={inputClass}
            >
              <option value="">Select</option>
              {lists.educations.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </Select3d>
          </Field>
          <Field label="College / university">
            <input
              name="college_name"
              maxLength={160}
              autoComplete="off"
              placeholder="Type the college name — no list to pick from"
              defaultValue={values?.college_name ?? ""}
              className={inputClass}
            />
          </Field>
          <Field label="Working as" required>
            <Select3d
              name="occupation"
              required
              defaultValue={values?.occupation ?? ""}
              className={inputClass}
            >
              <option value="">Select</option>
              {lists.occupations.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </Select3d>
          </Field>
          <Field
            label="Employed in"
            help="The kind of workplace: private company, government, business, studies, and so on."
          >
            <Select3d
              name="employed_in"
              defaultValue={pickListed(lists.employedIn, values?.employed_in ?? d.employed_in)}
              className={inputClass}
            >
              {lists.employedIn.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </Select3d>
          </Field>
          <Field label="Employer name">
            <input
              name="employer_name"
              maxLength={120}
              placeholder="Name of the workplace"
              defaultValue={values?.employer_name ?? d.employer_name}
              className={inputClass}
            />
          </Field>
          <Field label="Annual income">
            <Select3d
              name="income_band"
              defaultValue={pickListed(lists.incomes, values?.income_band ?? d.income_band)}
              className={inputClass}
            >
              {lists.incomes.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </Select3d>
          </Field>
          <Field
            label="Want to settle abroad?"
            help="Whether they hope to live overseas, stay in India, or remain open."
          >
            <Select3d name="settle_abroad" defaultValue={values?.settle_abroad ?? ""} className={inputClass}>
              <option value="">Not mentioned</option>
              {SETTLE_ABROAD.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </Select3d>
          </Field>
          <Field
            label="Future ambition"
            help="Optional. One line — a goal they hold, if they wish to say."
          >
            <input
              name="future_ambition"
              maxLength={120}
              autoComplete="off"
              placeholder="If any — one line"
              defaultValue={values?.future_ambition ?? ""}
              className={inputClass}
            />
          </Field>
          </>
          ) : null}
        </div>
      </section>
      ) : null}

      {show("personal") ? (
      <section className="form-3d-panel">
        <p className="form-3d-kicker">{mode === "edit" ? "Habits" : "Health"}</p>
        <h2 className="form-3d-title">Health and habits</h2>
        <div className="gold-ornament" />
        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <Field label="Diet">
            <Select3d
              name="diet"
              defaultValue={pickListed(lists.diets, values?.diet ?? d.diet)}
              className={inputClass}
            >
              {lists.diets.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </Select3d>
          </Field>
          <Field
            label="Disability"
            help="Share only if there is a physical disability the family wishes families to know."
          >
            <Select3d
              name="physical_status"
              defaultValue={values?.physical_status ?? ""}
              className={inputClass}
            >
              <option value="">Not mentioned</option>
              {lists.physicalStatuses.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </Select3d>
          </Field>
          <Field
            label="Health status"
            className="sm:col-span-2"
            help="Optional. Blood pressure, sugar, thyroid, or any other issue you wish to mention."
          >
            <textarea
              name="health_notes"
              maxLength={400}
              rows={2}
              placeholder="Blood pressure, sugar, thyroid, or any other issue you wish to mention."
              defaultValue={values?.health_notes ?? ""}
              className={inputClass}
            />
          </Field>
          <HopePicker
            className="sm:col-span-2"
            label="Hobbies and interests"
            name="hobby_list"
            options={lists.hobbies}
            selected={asStringList(values?.hobby_list)}
          />
        </div>
      </section>
      ) : null}

      {show("faith") ? (
      <section className="form-3d-panel">
        <p className="form-3d-kicker">{mode === "edit" ? "Faith" : "Religion"}</p>
        <h2 className="form-3d-title">Religion and astronomy</h2>
        <div className="gold-ornament" />
        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <div className="field-3d sm:col-span-2">
            <span className="field-3d-label">
              Date of birth
              <span className="field-star" aria-hidden>
                *
              </span>
            </span>
            <BirthDatePicker
              name="date_of_birth"
              defaultValue={values?.date_of_birth ?? ""}
            />
          </div>
          <Field label="Time of birth" required>
            <BirthTimePicker name="birth_time" defaultValue={values?.birth_time ?? ""} />
          </Field>
          <Field label="City of birth" required>
            <input
              name="birth_city"
              required
              maxLength={80}
              placeholder="City where they were born"
              defaultValue={values?.birth_city ?? ""}
              className={inputClass}
            />
          </Field>
          <Field label="Religion">
            <Select3d
              name="religion_id"
              required
              value={religionId}
              onChange={(e) => setReligionId(e.target.value)}
              className={inputClass}
            >
              <option value="">Select</option>
              {faiths.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </Select3d>
          </Field>
          <Field
            label="Community"
            help="The community or caste for the religion you picked, if the family wishes to share it."
          >
            <Select3d
              name="community_id"
              defaultValue={values?.community_id ?? ""}
              key={religionId || "religion"}
              disabled={!religionId}
              className={inputClass}
            >
              <option value="">{religionId ? "Select" : "Pick a religion first"}</option>
              {communityChoices.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select3d>
          </Field>
          <Field
            label="Sub-community"
            help="A smaller group within the community, if the family uses one."
          >
            <input
              name="sub_community"
              maxLength={80}
              placeholder="Sub-caste or sub-community, if any"
              defaultValue={values?.sub_community ?? ""}
              className={inputClass}
            />
          </Field>
          <Field
            label="Gothra"
            help="In Hindu families, gothra is the clan. Marriage within the same gothra is usually not preferred."
          >
            <Select3d name="gotra" defaultValue={values?.gotra ?? ""} className={inputClass}>
              <option value="">Select</option>
              {lists.gotras.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </Select3d>
          </Field>
          <Field label="Rashi" help="Moon sign.">
            <Select3d name="rashi" defaultValue={values?.rashi ?? ""} className={inputClass}>
              <option value="">Not mentioned</option>
              {lists.rashis.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </Select3d>
          </Field>
          <Field label="Lagna" help="Ascendant sign.">
            <Select3d name="lagna" defaultValue={values?.lagna ?? ""} className={inputClass}>
              <option value="">Not mentioned</option>
              {lists.rashis.map((item) => (
                <option key={`lagna-${item}`}>{item}</option>
              ))}
            </Select3d>
          </Field>
          <Field label="Nakshatra">
            <Select3d name="nakshatra" defaultValue={values?.nakshatra ?? ""} className={inputClass}>
              <option value="">Not mentioned</option>
              {lists.nakshatras.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </Select3d>
          </Field>
          <Field label="Nakshatra pada">
            <Select3d name="nakshatra_pada" defaultValue={values?.nakshatra_pada ?? ""} className={inputClass}>
              <option value="">Not mentioned</option>
              {lists.nakshatraPadas.map((item) => (
                <option key={item} value={item}>
                  Pada {item}
                </option>
              ))}
            </Select3d>
          </Field>
          <Field label="Gana">
            <Select3d name="gana" defaultValue={values?.gana ?? ""} className={inputClass}>
              <option value="">Not mentioned</option>
              {lists.ganas.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </Select3d>
          </Field>
          <Field label="Yoni animal">
            <Select3d name="yoni_animal" defaultValue={values?.yoni_animal ?? ""} className={inputClass}>
              <option value="">Not mentioned</option>
              {lists.yoniAnimals.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </Select3d>
          </Field>
          <Field label="Mangalik">
            <Select3d name="manglik" defaultValue={values?.manglik ?? ""} className={inputClass}>
              <option value="">Not mentioned</option>
              {lists.manglik.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </Select3d>
          </Field>
        </div>
      </section>
      ) : null}

      {show("about") ? (
      <section className="form-3d-panel">
        <p className="form-3d-kicker">Story</p>
        <h2 className="form-3d-title">About</h2>
        <div className="gold-ornament" />
        <p className="mt-3 text-sm text-[var(--muted)]">
          Write About here, or add a short video or voice note later from Introduction.
        </p>
        <div className="mt-6 grid gap-5">
          <div className="field-3d">
            <span className="field-3d-label">
              {self ? "About you" : "About them"}
              <span className="field-star" aria-hidden>
                *
              </span>
              <FieldHelp text={`Write ${ABOUT_MIN}–${ABOUT_MAX} characters, or add video or voice instead.`} />
            </span>
            <AboutEditor
              name="about"
              key={values?.about ? "about-saved" : "about-new"}
              placeholder={`Write at least ${ABOUT_MIN} characters, or leave empty for video or voice.`}
              defaultValue={aboutDefault}
            />
          </div>
        </div>
      </section>
      ) : null}

      {show("family") ? (
      <section className="form-3d-panel">
        <p className="form-3d-kicker">Family</p>
        <h2 className="form-3d-title">Family background</h2>
        <div className="gold-ornament" />
        <p className="mt-3 text-sm text-[var(--muted)]">
          Say as much as you wish — brothers, sisters, what parents do, and where the family lives.
        </p>
        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <Field
            label="Family type"
            help="Nuclear is parents and children. Joint is a larger household living together."
          >
            <Select3d
              name="family_type"
              defaultValue={pickListed(lists.families, values?.family_type ?? d.family_type)}
              className={inputClass}
            >
              {lists.families.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </Select3d>
          </Field>
          <Field
            label="Family living standard"
            help="A broad sense of the household’s means — not a test, only what the family is comfortable saying."
          >
            <Select3d
              name="family_status"
              defaultValue={values?.family_status ?? ""}
              className={inputClass}
            >
              <option value="">Not mentioned</option>
              {lists.familyStatuses.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </Select3d>
          </Field>
          <Field label="Where the family lives" className="sm:col-span-2">
            <input
              name="family_location"
              maxLength={120}
              autoComplete="off"
              placeholder="City and area"
              defaultValue={
                values?.family_location?.trim() ||
                (nativeCity && nativeState ? `${nativeCity}, ${nativeState}` : "")
              }
              className={inputClass}
            />
          </Field>
          <SiblingCounts
            label="Brothers"
            marriedLabel="Married brothers"
            totalName="brothers_count"
            marriedName="brothers_married_count"
            totalDefault={values?.brothers_count}
            marriedDefault={values?.brothers_married_count}
          />
          <SiblingCounts
            label="Sisters"
            marriedLabel="Married sisters"
            totalName="sisters_count"
            marriedName="sisters_married_count"
            totalDefault={values?.sisters_count}
            marriedDefault={values?.sisters_married_count}
          />
          <Field label="Father's name">
            <input
              name="father_name"
              maxLength={80}
              autoComplete="off"
              placeholder="Given name"
              defaultValue={values?.father_name ?? ""}
              className={inputClass}
            />
          </Field>
          <Field label="Mother's name">
            <input
              name="mother_name"
              maxLength={80}
              autoComplete="off"
              placeholder="Given name"
              defaultValue={values?.mother_name ?? ""}
              className={inputClass}
            />
          </Field>
          <Field label="Father's profession">
            <input
              name="father_occupation"
              maxLength={120}
              autoComplete="off"
              placeholder="Service, business, retired…"
              defaultValue={values?.father_occupation ?? ""}
              className={inputClass}
            />
          </Field>
          <Field label="Mother's profession">
            <input
              name="mother_occupation"
              maxLength={120}
              autoComplete="off"
              placeholder="Homemaker, service, retired…"
              defaultValue={values?.mother_occupation ?? ""}
              className={inputClass}
            />
          </Field>
          <div className="field-3d sm:col-span-2">
            <span className="field-3d-label">
              About the family
              <FieldHelp text={`Up to ${FAMILY_NOTE_MAX} characters.`} />
            </span>
            <AboutEditor
              name="siblings_note"
              min={0}
              max={FAMILY_NOTE_MAX}
              key={values?.siblings_note ? "family-note-saved" : "family-note-new"}
              placeholder="Whatever you wish to say about the family."
              defaultValue={values?.siblings_note ?? ""}
            />
          </div>
        </div>
      </section>
      ) : null}

      {show("partner") ? (
      <section className="form-3d-panel">
        <p className="form-3d-kicker">{mode === "edit" ? "Hope for a match" : "Step five"}</p>
        <h2 className="form-3d-title">Partner Preference</h2>
        <div className="gold-ornament" />
        <p className="mt-3 text-sm text-[var(--muted)]">
          These are partner expectations — age, height, faith, home, education, work, diet.
          Open each list and tick only what matters.
        </p>
        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <Field label="Age from">
            <Select3d
              name="pref_age_min"
              defaultValue={String(values?.pref_age_min ?? d.pref_age_min)}
              className={inputClass}
            >
              {Array.from({ length: 40 }, (_, i) => 21 + i).map((n) => (
                <option key={n} value={n}>
                  {n} years
                </option>
              ))}
            </Select3d>
          </Field>
          <Field label="Age to">
            <Select3d
              name="pref_age_max"
              defaultValue={String(values?.pref_age_max ?? d.pref_age_max)}
              className={inputClass}
            >
              {Array.from({ length: 40 }, (_, i) => 21 + i).map((n) => (
                <option key={n} value={n}>
                  {n} years
                </option>
              ))}
            </Select3d>
          </Field>
          <Field label="Height from">
            <Select3d
              name="pref_height_min"
              defaultValue={String(
                pickListed(
                  lists.heights.map(String),
                  String(values?.pref_height_min ?? d.pref_height_min),
                ),
              )}
              className={inputClass}
            >
              {lists.heights.map((h) => (
                <option key={`min-${h}`} value={h}>
                  {h} cm
                </option>
              ))}
            </Select3d>
          </Field>
          <Field label="Height to">
            <Select3d
              name="pref_height_max"
              defaultValue={String(
                pickListed(
                  lists.heights.map(String),
                  String(values?.pref_height_max ?? d.pref_height_max),
                ),
              )}
              className={inputClass}
            >
              {lists.heights.map((h) => (
                <option key={`max-${h}`} value={h}>
                  {h} cm
                </option>
              ))}
            </Select3d>
          </Field>
          <HopePicker
            label="Marital status"
            name="pref_maritals"
            anyValue={HOPE_ANY.marital}
            anyLabel="Any marital status"
            options={lists.marital}
            selected={hopeValues(values, "pref_maritals", "pref_marital")}
          />
          <HopePicker
            label="Mother tongue"
            name="pref_tongues"
            anyValue={HOPE_ANY.language}
            options={lists.tongues}
            selected={hopeValues(values, "pref_tongues")}
          />
          <HopePicker
            label="Religion"
            name="pref_religions"
            anyValue={HOPE_ANY.religion}
            options={faiths.map((r) => r.name)}
            selected={hopeValues(values, "pref_religions")}
          />
          <HopePicker
            label="Community / caste"
            name="pref_communities"
            anyValue={HOPE_ANY.community}
            options={casteNames}
            selected={hopeValues(values, "pref_communities")}
          />
          <HopePicker
            label="Country living in"
            name="pref_countries"
            anyValue={HOPE_ANY.country}
            options={lists.hopeCountries}
            selected={hopeValues(values, "pref_countries", "pref_country")}
          />
          <HopePicker
            label="State living in"
            name="pref_states"
            anyValue={HOPE_ANY.state}
            options={lists.states}
            selected={prefStates}
            onChange={setPrefStates}
          />
          <HopePicker
            key={anyPrefState ? "city-any-state" : `city-${[...prefStates].sort().join("|")}`}
            label="City / district"
            name="pref_cities"
            anyValue={HOPE_ANY.city}
            options={prefCityOptions}
            selected={
              anyPrefState
                ? [HOPE_ANY.city]
                : hopeValues(values, "pref_cities").filter(
                    (c) => c === HOPE_ANY.city || prefCityOptions.includes(c),
                  )
            }
            disabled={anyPrefState}
            disabledHint="City is locked when Any state is chosen. Pick one or more states to choose cities from those states only."
          />
          <Field
            label="Is horoscopic match preferred?"
            help="Whether matching kundali / horoscope matters for this alliance."
          >
            <Select3d
              name="pref_horoscope"
              defaultValue={hopeValues(values, "pref_horoscope")[0] ?? "Does not matter"}
              className={inputClass}
            >
              {lists.horoscopePref.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </Select3d>
          </Field>
          <HopePicker
            label="Education"
            name="pref_educations"
            anyValue={HOPE_ANY.education}
            options={lists.educations}
            selected={hopeValues(values, "pref_educations", "pref_education")}
          />
          <HopePicker
            label="Working as"
            name="pref_occupations"
            anyValue={HOPE_ANY.occupation}
            options={lists.occupations}
            selected={hopeValues(values, "pref_occupations", "pref_occupation")}
          />
          <HopePicker
            label="Employed in"
            name="pref_employed"
            anyValue={HOPE_ANY.employed}
            options={lists.employedIn}
            selected={hopeValues(values, "pref_employed")}
          />
          <HopePicker
            label="Annual income"
            help="A floor they hope the match earns — for example greater than ₹10 lakh — not a closed band."
            name="pref_incomes"
            anyValue={HOPE_ANY.income}
            options={lists.hopeIncomes}
            selected={hopeValues(values, "pref_incomes")}
            alphabetize={false}
          />
          <HopePicker
            label="Diet"
            name="pref_diets"
            anyValue={HOPE_ANY.diet}
            options={lists.diets}
            selected={hopeValues(values, "pref_diets")}
          />
        </div>
      </section>
      ) : null}
      <section className="form-3d-panel">
        <div className="form-3d-actions">
          {error ? (
            <p className="w-full rounded-xl border border-red-200 bg-white px-4 py-3 text-sm text-red-800">
              {error}
            </p>
          ) : null}
          {cancelHref ? (
            <Link href={cancelHref} className={`${btnHeroGhost} form-3d-cancel`}>
              Cancel
            </Link>
          ) : null}
          <SaveButton />
        </div>
      </section>
    </form>
  );
}
