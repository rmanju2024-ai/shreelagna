"use client";

import { useState } from "react";
import { saveProfile } from "@/app/app/profiles/actions";
import { BirthDatePicker, BirthTimePicker } from "@/app/app/profiles/birth-date-picker";
import {
  creatorRolesForForm,
  HOPE_ANY,
  isIndiaNative,
  LIVING_ARRANGEMENTS,
  PROFILE_FORM_DEFAULTS,
  PARENT_PROFESSIONS,
  SETTLE_ABROAD,
  DONT_KNOW,
  choiceLabel,
} from "@/lib/profile/options";
import { citiesForState, pickListed, sortLabels, type FormLists } from "@/lib/profile/form-lists";
import { asStringList, hopeValues, languagesKnown } from "@/lib/profile/multi-values";
import { parseParentTags } from "@/lib/profile/parent-line";
import { FieldHelp } from "@/app/app/profiles/field-help";
import { FieldMark } from "@/app/app/profiles/field-mark";
import { HopePicker } from "@/app/app/profiles/hope-picker";
import Link from "next/link";
import { Select3d } from "@/components/select3d";
import { btnHero, btnHeroGhost, inputClass } from "@/lib/ui/classes";
import { type ProfileEditSection } from "@/lib/profile/sections";
import { AboutEditor } from "@/app/app/profiles/about-editor";
import { MobileOtpField } from "@/app/app/profiles/mobile-otp-field";
import { ABOUT_MAX, ABOUT_MIN, FAMILY_NOTE_MAX } from "@/lib/profile/about-html";

import type { ProfileFormValues } from "@/app/app/profiles/profile-form-types";
import { Field, PlaceBlock, SaveButton, SiblingCounts } from "@/app/app/profiles/profile-form-parts";
import { useStudioTab } from "@/app/app/profiles/profile-studio";

export type { ProfileFormValues };

const WIZARD_STEPS = [
  { id: 1, short: "Start", title: "Basics", hint: "Who, identity and contact", mark: "Name" },
  { id: 2, short: "Life", title: "Life today", hint: "Home, work and lifestyle", mark: "Occupation" },
  { id: 3, short: "Faith", title: "Faith", hint: "Birth and horoscope", mark: "Religion" },
  { id: 4, short: "Story", title: "Your story", hint: "About and family", mark: "About" },
  { id: 5, short: "Match", title: "Preferences", hint: "What you are looking for", mark: "Partner" },
] as const;

const PARENT_PROFESSION_OPTIONS = PARENT_PROFESSIONS.map((item) => ({
  value: item,
  label: choiceLabel(item),
}));

export function ProfileForm({
  values,
  religions,
  communities,
  lists,
  error,
  mode = "create",
  section,
  loginEmail,
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
  const studio = useStudioTab();
  const studioSection =
    studio && studio.tab !== "album" && studio.tab !== "about"
      ? studio.tab === "life"
        ? "work"
        : (studio.tab as ProfileEditSection)
      : undefined;
  const activeSection = studioSection ?? section;
  const show = (id: ProfileEditSection) =>
    (!omitAbout || id !== "about") && (!activeSection || activeSection === id);
  const wizard = mode === "create" && !section && !studio;
  const paged = wizard;
  const [wizardStep, setWizardStep] = useState(1);
  const page = wizardStep;
  const panelClass = (step: number) =>
    `form-3d-panel${paged ? ` wizard-panel${page === step ? " is-current" : ""}` : ""}`;

  function moveWizard(next: number) {
    setWizardStep(Math.min(WIZARD_STEPS.length, Math.max(1, next)));
    window.requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: "smooth" }));
  }

  return (
    <form
      action={saveProfile}
      className={`form-3d atelier${paged ? " is-wizard" : ""}`}
      autoComplete="off"
      noValidate={paged}
      onSubmit={(event) => {
        if (!paged) return;
        const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
        if (submitter?.value === "draft") return;
        const invalid = event.currentTarget.querySelector<HTMLElement>(":invalid");
        if (!invalid) return;
        event.preventDefault();
        const targetStep = Number(invalid.closest<HTMLElement>(".wizard-panel")?.dataset.step ?? 1);
        if (wizard) setWizardStep(targetStep);
        window.setTimeout(() => {
          invalid.focus({ preventScroll: true });
          invalid.scrollIntoView({ block: "center", behavior: "smooth" });
          if ("reportValidity" in invalid) (invalid as HTMLInputElement).reportValidity();
        });
      }}
    >
      {values?.id ? <input type="hidden" name="id" value={values.id} /> : null}
      {values?.member_code ? <input type="hidden" name="member_code" value={values.member_code} /> : null}
      {activeSection ? <input type="hidden" name="section" value={activeSection} /> : null}
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
      {error && !/family within 600/i.test(error) ? (
        <p className="rounded-xl border border-red-200 bg-white px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      ) : null}

      {mode === "edit" ? <input type="hidden" name="creator_relationship" value={who} /> : null}

      {wizard ? (
        <div className="profile-wizard">
          <div className="profile-wizard-hero">
            <span aria-hidden>✨</span>
            <div>
              <p>Guided profile setup</p>
              <h2>Tell your story, one easy step at a time</h2>
              <small>
                Fill what you know now. Optional details can be improved later from Profile.
              </small>
            </div>
          </div>
          <nav className="profile-wizard-steps" aria-label="Profile creation progress">
            {WIZARD_STEPS.map((item) => (
              <button
                key={item.id}
                type="button"
                className={wizardStep === item.id ? "is-current" : wizardStep > item.id ? "is-done" : ""}
                aria-current={wizardStep === item.id ? "step" : undefined}
                disabled={item.id > wizardStep}
                onClick={() => moveWizard(item.id)}
              >
                <b>{wizardStep > item.id ? "✓" : <FieldMark label={item.mark} />}</b>
                <span>
                  <strong>{item.short}</strong>
                  <small>{item.title}</small>
                </span>
              </button>
            ))}
          </nav>
          <div className="profile-wizard-guide">
            <span aria-hidden>?</span>
            <p>
              <b>{WIZARD_STEPS[wizardStep - 1].title}:</b>{" "}
              {WIZARD_STEPS[wizardStep - 1].hint}. Fields marked <strong>*</strong> help unlock your profile.
            </p>
          </div>
        </div>
      ) : null}

      {show("family") && mode !== "edit" ? (
      <section className={panelClass(1)} data-step="1">
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
      <section className={panelClass(1)} data-step="1">
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
                <option key={item} value={item}>
                  {choiceLabel(item)}
                </option>
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
            help="We send an Arattai code. No SMS. WhatsApp is not used."
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
      <section className={panelClass(2)} data-step="2">
        <p className="form-3d-kicker">
          {activeSection === "work" ? "Education & work" : activeSection === "personal" ? "Place" : mode === "edit" ? "Home and vocation" : "Step three"}
        </p>
        <h2 className="form-3d-title">
          {activeSection === "work" ? "Education and work" : activeSection === "personal" ? "Native place and residence" : "Home and vocation"}
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
            label="Wish to settle in abroad?"
            help="Yes if they hope to live overseas, No to stay in India, Open if either is fine."
          >
            <Select3d name="settle_abroad" defaultValue={values?.settle_abroad ?? ""} className={inputClass}>
              <option value="">Not mentioned</option>
              {SETTLE_ABROAD.map((item) => (
                <option key={item} value={item}>
                  {choiceLabel(item)}
                </option>
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
      <section className={panelClass(2)} data-step="2">
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
                <option key={item} value={item}>
                  {choiceLabel(item)}
                </option>
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
      <section className={panelClass(3)} data-step="3">
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
                <option key={item} value={item}>
                  {choiceLabel(item)}
                </option>
              ))}
            </Select3d>
          </Field>
          <Field label="Rashi" help="Moon sign.">
            <Select3d name="rashi" defaultValue={values?.rashi ?? ""} className={inputClass}>
              <option value="">Not mentioned</option>
              {lists.rashis.map((item) => (
                <option key={item} value={item}>
                  {choiceLabel(item)}
                </option>
              ))}
            </Select3d>
          </Field>
          <Field label="Lagna" help="Ascendant sign.">
            <Select3d name="lagna" defaultValue={values?.lagna ?? ""} className={inputClass}>
              <option value="">Not mentioned</option>
              {lists.rashis.map((item) => (
                <option key={`lagna-${item}`} value={item}>
                  {choiceLabel(item)}
                </option>
              ))}
            </Select3d>
          </Field>
          <Field label="Nakshatra">
            <Select3d name="nakshatra" defaultValue={values?.nakshatra ?? ""} className={inputClass}>
              <option value="">Not mentioned</option>
              {lists.nakshatras.map((item) => (
                <option key={item} value={item}>
                  {choiceLabel(item)}
                </option>
              ))}
            </Select3d>
          </Field>
          <Field label="Nakshatra pada">
            <Select3d name="nakshatra_pada" defaultValue={values?.nakshatra_pada ?? ""} className={inputClass}>
              <option value="">Not mentioned</option>
              {lists.nakshatraPadas.map((item) => (
                <option key={item} value={item}>
                  {item === DONT_KNOW ? choiceLabel(item) : `Pada ${item}`}
                </option>
              ))}
            </Select3d>
          </Field>
          <Field label="Gana">
            <Select3d name="gana" defaultValue={values?.gana ?? ""} className={inputClass}>
              <option value="">Not mentioned</option>
              {lists.ganas.map((item) => (
                <option key={item} value={item}>
                  {choiceLabel(item)}
                </option>
              ))}
            </Select3d>
          </Field>
          <Field label="Yoni animal">
            <Select3d name="yoni_animal" defaultValue={values?.yoni_animal ?? ""} className={inputClass}>
              <option value="">Not mentioned</option>
              {lists.yoniAnimals.map((item) => (
                <option key={item} value={item}>
                  {choiceLabel(item)}
                </option>
              ))}
            </Select3d>
          </Field>
          <Field label="Mangalik">
            <Select3d name="manglik" defaultValue={values?.manglik ?? ""} className={inputClass}>
              <option value="">Not mentioned</option>
              {lists.manglik.map((item) => (
                <option key={item} value={item}>
                  {choiceLabel(item)}
                </option>
              ))}
            </Select3d>
          </Field>
        </div>
      </section>
      ) : null}

      {show("about") ? (
      <section className={panelClass(4)} data-step="4">
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
      <section className={panelClass(4)} data-step="4">
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
          <HopePicker
            label="Father's profession"
            name="father_occupation"
            alphabetize={false}
            options={PARENT_PROFESSION_OPTIONS}
            selected={parseParentTags(values?.father_occupation)}
            help="Tick several if needed — for example Passed away and Business, or Dont Know if you are not sure."
          />
          <HopePicker
            label="Mother's profession"
            name="mother_occupation"
            alphabetize={false}
            options={PARENT_PROFESSION_OPTIONS}
            selected={parseParentTags(values?.mother_occupation)}
            help="Tick several if needed — for example Passed away and Homemaker, or Dont Know if you are not sure."
          />
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
      <section className={panelClass(5)} data-step="5">
        <p className="form-3d-kicker">{mode === "edit" ? "Hope for a match" : "Step five"}</p>
        <h2 className="form-3d-title">Partner preference</h2>
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

      {wizard ? (
        <div className="profile-wizard-actions">
          <button
            type="button"
            className={btnHeroGhost}
            onClick={() => moveWizard(wizardStep - 1)}
            disabled={wizardStep === 1}
          >
            ← Back
          </button>
          <span>
            Step {wizardStep} of {WIZARD_STEPS.length}
          </span>
          {wizardStep < WIZARD_STEPS.length ? (
            <button type="button" className={btnHero} onClick={() => moveWizard(wizardStep + 1)}>
              Next →
            </button>
          ) : null}
        </div>
      ) : null}
      {wizard && wizardStep === 5 ? (
        <div className="profile-readiness">
          <span aria-hidden>💡</span>
          <div>
            <h3>Save now, activate when ready</h3>
            <p>
              Your profile is saved as a draft until the required details, approved photo and verification
              are complete. Draft profiles cannot send interests, chat, or reveal contact details.
            </p>
            <ul>
              <li>Missing fields will be shown clearly on your Profile page.</li>
              <li>You can return and improve every section later.</li>
              <li>When everything required is ready, the profile goes for house review.</li>
            </ul>
          </div>
        </div>
      ) : null}
      {!wizard || wizardStep === 5 ? (
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
          {wizard ? (
            <button type="submit" name="save_intent" value="draft" formNoValidate className={btnHeroGhost}>
              Save draft
            </button>
          ) : null}
          <SaveButton />
        </div>
      ) : null}
    </form>
  );
}
