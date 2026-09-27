import { describe, expect, it } from "vitest";
import { listsFromSeed } from "@/lib/profile/form-lists-seed";
import { SECTION_PAYLOAD_KEYS, type ProfileEditSection } from "@/lib/profile/sections";
import {
  aboutIntroFields,
  buildProfileSaveRow,
  compactRecord,
  pickSaveRow,
} from "@/lib/profile/save-payload";
import { parseProfileForm } from "@/lib/validation/profile";

const lists = listsFromSeed();
const identity = {
  createdBy: "11111111-1111-4111-8111-111111111111",
  creatorRelationship: "parent",
  profileType: "vadhu",
};

const full = {
  creator_relationship: "parent",
  profile_type: "vadhu",
  subject_full_name: "Meera Iyer",
  surname: "Iyer",
  date_of_birth: "1998-01-15",
  mother_tongue: "Tamil",
  height_cm: 162,
  marital_status: "never_married",
  diet: "Vegetarian",
  native_country: "India",
  native_state: "Tamil Nadu",
  native_city: "Chennai",
  current_country: "India",
  current_state: "Tamil Nadu",
  current_city: "Chennai",
  qualification: "B.Com",
  occupation: "Teacher",
  about: "Warm family, values education and kindness in equal measure for a life together.".padEnd(80, "."),
  prefer_not_community: true,
  subject_mobile: "9876543210",
  religion_id: "c3d4e5f6-a1b2-4c3d-8e9f-0123456789ab",
};

function saveFor(section: ProfileEditSection, raw: Record<string, unknown>) {
  const parsed = parseProfileForm(raw, lists, section);
  expect(parsed.ok).toBe(true);
  if (!parsed.ok) throw new Error(parsed.error);
  const row = buildProfileSaveRow(parsed.data, identity);
  return pickSaveRow(row, section, true);
}

describe("tab save payloads", () => {
  it("drops undefined keys", () => {
    expect(compactRecord({ a: 1, b: undefined, c: null })).toEqual({ a: 1, c: null });
  });

  it("does not patch intro when About is missing", () => {
    expect(aboutIntroFields(undefined)).toEqual({});
    expect(aboutIntroFields("A".repeat(80)).intro_shown).toBe("about");
  });

  it("saves About without touching partner hopes", () => {
    const payload = saveFor("about", { about: full.about });
    expect(payload.about).toBe(full.about);
    expect(payload.intro_shown).toBe("about");
    expect(payload).not.toHaveProperty("pref_notes");
    expect(payload).not.toHaveProperty("subject_full_name");
  });

  it("saves Personal without wiping About or partner hopes", () => {
    const payload = saveFor("personal", {
      profile_type: full.profile_type,
      subject_full_name: full.subject_full_name,
      surname: full.surname,
      grew_up_in: "Chennai",
      height_cm: full.height_cm,
      mother_tongue: full.mother_tongue,
      marital_status: full.marital_status,
      diet: full.diet,
      subject_mobile: full.subject_mobile,
      native_country: full.native_country,
      native_state: full.native_state,
      native_city: full.native_city,
      current_country: full.current_country,
      current_state: full.current_state,
      current_city: full.current_city,
    });
    expect(payload.subject_full_name).toBe("Meera Iyer");
    expect(payload.subject_mobile).toBe("9876543210");
    expect(payload).not.toHaveProperty("about");
    expect(payload).not.toHaveProperty("intro_shown");
    expect(payload).not.toHaveProperty("pref_age_min");
    expect(Object.keys(payload).every((key) => SECTION_PAYLOAD_KEYS.personal.includes(key))).toBe(true);
  });

  it("saves faith without requiring About", () => {
    const payload = saveFor("faith", {
      date_of_birth: full.date_of_birth,
      birth_time: "06:30",
      birth_city: "Chennai",
      religion_id: full.religion_id,
      gotra: "Don't know",
      rashi: lists.rashis[0],
    });
    expect(payload.date_of_birth).toBe("1998-01-15");
    expect(payload.religion_id).toBe(full.religion_id);
    expect(payload).not.toHaveProperty("about");
    expect(payload).not.toHaveProperty("qualification");
  });

  it("saves work including settle abroad and ambition", () => {
    const payload = saveFor("work", {
      qualification: "B.Com",
      occupation: "Teacher",
      employed_in: lists.employedIn[0],
      settle_abroad: "Yes",
      future_ambition: "IAS",
      college_name: "Stella Maris",
    });
    expect(payload.qualification).toBe("B.Com");
    expect(payload.settle_abroad).toBe("Yes");
    expect(payload.future_ambition).toBe("IAS");
    expect(payload).not.toHaveProperty("about");
  });

  it("saves family sibling counts without touching intro", () => {
    const payload = saveFor("family", {
      creator_relationship: "parent",
      family_type: lists.families[0],
      brothers_count: 2,
      brothers_married_count: 1,
      sisters_count: 0,
      sisters_married_count: 0,
      father_occupation: "Teacher",
      mother_occupation: "Homemaker",
    });
    expect(payload.brothers_count).toBe(2);
    expect(payload.brothers_married_count).toBe(1);
    expect(payload.sisters_married_count).toBe(0);
    expect(payload).not.toHaveProperty("about");
    expect(payload).not.toHaveProperty("creator_relationship");
  });

  it("saves partner hopes without About and without crashing", () => {
    const payload = saveFor("partner", {
      pref_age_min: 24,
      pref_age_max: 32,
      pref_height_min: 150,
      pref_height_max: 180,
      pref_tongues: ["Tamil"],
      pref_states: ["Tamil Nadu"],
      pref_cities: ["Chennai"],
      pref_countries: ["India"],
    });
    expect(payload.pref_age_min).toBe(24);
    expect(payload.pref_tongues).toEqual(["Tamil"]);
    expect(payload.pref_cities).toEqual(["Chennai"]);
    expect(payload).not.toHaveProperty("about");
    expect(payload).not.toHaveProperty("intro_shown");
    expect(payload).not.toHaveProperty("pref_notes");
    expect(typeof payload.pref_community_mode).toBe("string");
  });
});
