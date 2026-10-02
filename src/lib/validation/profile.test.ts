import { describe, expect, it } from "vitest";
import { listsFromSeed } from "@/lib/profile/form-lists-seed";
import { parseProfileForm } from "./profile";

const lists = listsFromSeed();

const base = {
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
  about: "Warm family, values education and kindness in equal measure for a life together.".repeat(1).padEnd(80, "."),
  prefer_not_community: true,
  subject_mobile: "9876543210",
  religion_id: "c3d4e5f6-a1b2-4c3d-8e9f-0123456789ab",
  birth_time: "06:30",
  birth_city: "Chennai",
};

describe("parseProfileForm", () => {
  it("accepts a valid family-posted profile", () => {
    const parsed = parseProfileForm(base, lists);
    expect(parsed.ok).toBe(true);
  });

  it("allows an incomplete profile to be saved as a draft", () => {
    const parsed = parseProfileForm(
      {
        creator_relationship: "self",
        profile_type: "vara",
        subject_full_name: "Arjun Rao",
        date_of_birth: "1995-06-12",
        qualification: "",
        occupation: "",
        subject_mobile: "",
      },
      lists,
      undefined,
      true,
    );
    expect(parsed.ok).toBe(true);
  });

  it("still requires database-safe identity basics for a draft", () => {
    expect(
      parseProfileForm(
        { creator_relationship: "self", profile_type: "vara", subject_full_name: "", date_of_birth: "" },
        lists,
        undefined,
        true,
      ).ok,
    ).toBe(false);
  });

  it("does not allow an under-21 draft profile", () => {
    const parsed = parseProfileForm(
      {
        creator_relationship: "self",
        profile_type: "vadhu",
        subject_full_name: "Young Person",
        date_of_birth: "2010-01-01",
      },
      lists,
      undefined,
      true,
    );
    expect(parsed.ok).toBe(false);
  });

  it("rejects a missing required native city", () => {
    const parsed = parseProfileForm({ ...base, native_city: "" }, lists);
    expect(parsed.ok).toBe(false);
  });

  it("rejects a missing religion", () => {
    const parsed = parseProfileForm({ ...base, religion_id: "" }, lists);
    expect(parsed.ok).toBe(false);
  });

  it("rejects under-21 dates", () => {
    const parsed = parseProfileForm({ ...base, date_of_birth: "2010-01-01" }, lists);
    expect(parsed.ok).toBe(false);
  });

  it("accepts a sister posting a profile", () => {
    const parsed = parseProfileForm({ ...base, creator_relationship: "sister" }, lists);
    expect(parsed.ok).toBe(true);
  });

  it("accepts families from any Indian state", () => {
    const parsed = parseProfileForm(
      {
        ...base,
        native_state: "Maharashtra",
        native_city: "Pune",
        mother_tongue: "Marathi",
        current_state: "Maharashtra",
        current_city: "Pune",
      },
      lists,
    );
    expect(parsed.ok).toBe(true);
  });

  it("keeps several expected mother tongues", () => {
    const parsed = parseProfileForm(
      {
        ...base,
        pref_tongues: ["Tamil", "Hindi", "English"],
      },
      lists,
    );
    expect(parsed.ok).toBe(true);
    if (parsed.ok) expect(parsed.data.pref_tongues).toEqual(["Tamil", "Hindi", "English"]);
  });

  it("locks preferred cities to Any city when Any state is chosen", () => {
    const parsed = parseProfileForm(
      {
        ...base,
        pref_states: ["Any state"],
        pref_cities: ["Chennai", "Bengaluru"],
      },
      lists,
    );
    expect(parsed.ok).toBe(true);
    if (parsed.ok) expect(parsed.data.pref_cities).toEqual(["Any city"]);
  });

  it("keeps preferred cities that belong to the chosen states", () => {
    const parsed = parseProfileForm(
      {
        ...base,
        pref_states: ["Tamil Nadu", "Karnataka"],
        pref_cities: ["Chennai", "Bengaluru", "Mumbai"],
      },
      lists,
    );
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.data.pref_cities).toEqual(["Chennai", "Bengaluru"]);
    }
  });

  it("stores Any language, state, city, and country as hopes", () => {
    const parsed = parseProfileForm(
      {
        ...base,
        pref_tongues: ["Any language"],
        pref_states: ["Any state"],
        pref_cities: ["Any city"],
        pref_country: "Any country",
        pref_religions: ["Any religion"],
        pref_communities: ["Any community"],
        pref_education: "Any education",
        pref_occupation: "Any occupation",
        pref_marital: "any",
        pref_diets: ["Any diet"],
        pref_incomes: ["Any income"],
      },
      lists,
    );
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.data.pref_tongues).toEqual(["Any language"]);
      expect(parsed.data.pref_states).toEqual(["Any state"]);
      expect(parsed.data.pref_cities).toEqual(["Any city"]);
      expect(parsed.data.pref_country).toBe("Any country");
      expect(parsed.data.pref_countries).toEqual(["Any country"]);
      expect(parsed.data.pref_diets).toEqual(["Any diet"]);
    }
  });

  it("keeps India and the United Kingdom as hoped-for countries", () => {
    const parsed = parseProfileForm(
      {
        ...base,
        pref_countries: ["India", "United Kingdom"],
        pref_maritals: ["never_married", "divorced"],
      },
      lists,
    );
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.data.pref_countries).toEqual(["India", "United Kingdom"]);
      expect(parsed.data.pref_maritals).toEqual(["never_married", "divorced"]);
    }
  });

  it("accepts a typed college name", () => {
    const parsed = parseProfileForm(
      { ...base, college_name: "RV College of Engineering" },
      lists,
    );
    expect(parsed.ok).toBe(true);
    if (parsed.ok) expect(parsed.data.college_name).toBe("RV College of Engineering");
  });

  it("defaults native country to India and still needs an Indian city", () => {
    const parsed = parseProfileForm(base, lists);
    expect(parsed.ok).toBe(true);
    if (parsed.ok) expect(parsed.data.native_country).toBe("India");
  });

  it("allows different native and current Indian cities", () => {
    const parsed = parseProfileForm(
      {
        ...base,
        native_state: "Tamil Nadu",
        native_city: "Chennai",
        current_state: "Karnataka",
        current_city: "Bengaluru",
      },
      lists,
    );
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.data.native_city).toBe("Chennai");
      expect(parsed.data.current_city).toBe("Bengaluru");
    }
  });

  it("allows a non-Indian native country without state or city", () => {
    const parsed = parseProfileForm(
      {
        ...base,
        native_country: "United States",
        native_state: "",
        native_city: "",
        current_country: "United States",
        current_state: "",
        current_city: "",
      },
      lists,
    );
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.data.native_country).toBe("United States");
      expect(parsed.data.native_state).toBeUndefined();
      expect(parsed.data.current_city).toBe("");
    }
  });

  it("saves looking-for without requiring other sections", () => {
    const parsed = parseProfileForm(
      {
        pref_states: ["Any state"],
        pref_cities: ["Chennai"],
        pref_horoscope: "Does not matter",
      },
      lists,
      "partner",
    );
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.data.pref_cities).toEqual(["Any city"]);
      expect(parsed.data.pref_horoscope).toBe("Does not matter");
    }
  });

  it("requires about length only when saving the about section", () => {
    const parsed = parseProfileForm({ about: "Too short" }, lists, "about");
    expect(parsed.ok).toBe(false);
  });

  it("counts visible about text and stores plain text", () => {
    const story = `<b>${"Kind and family-minded, looking for a life of care. ".repeat(2)}</b>`;
    const parsed = parseProfileForm({ about: `${story}<script>x()</script>` }, lists, "about");
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.data.about).toContain("Kind and family-minded");
      expect(parsed.data.about).not.toContain("<b>");
      expect(parsed.data.about).not.toContain("script");
    }
  });

  it("keeps looking-for religions on a partner section save", () => {
    const parsed = parseProfileForm(
      {
        pref_religions: ["Hindu", "Jain"],
        pref_tongues: ["Tamil", "English"],
        pref_horoscope: "Yes",
      },
      lists,
      "partner",
    );
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.data.pref_religions).toEqual(["Hindu", "Jain"]);
      expect(parsed.data.pref_tongues).toEqual(["Tamil", "English"]);
      expect(parsed.data.pref_horoscope).toBe("Yes");
    }
  });

  it("keeps known languages on a personal section save", () => {
    const parsed = parseProfileForm(
      {
        ...base,
        known_languages: ["Tamil", "English"],
      },
      lists,
      "personal",
    );
    expect(parsed.ok).toBe(true);
    if (parsed.ok) expect(parsed.data.known_languages).toEqual(["Tamil", "English"]);
  });

  it("saves personal without requiring religion", () => {
    const parsed = parseProfileForm({ ...base, religion_id: "" }, lists, "personal");
    expect(parsed.ok).toBe(true);
  });

  it("requires gharane or surname on the personal section", () => {
    const parsed = parseProfileForm({ ...base, surname: "" }, lists, "personal");
    expect(parsed.ok).toBe(false);
  });

  it("allows an optional living arrangement from the list", () => {
    const parsed = parseProfileForm({ ...base, living_arrangement: "Rented" }, lists, "personal");
    expect(parsed.ok).toBe(true);
    const bad = parseProfileForm({ ...base, living_arrangement: "Villa" }, lists, "personal");
    expect(bad.ok).toBe(false);
  });

  it("requires religion on the faith section", () => {
    const parsed = parseProfileForm({ religion_id: "" }, lists, "faith");
    expect(parsed.ok).toBe(false);
  });

  it("keeps rashi, gana and yoni on a faith section save", () => {
    const parsed = parseProfileForm(
      {
        religion_id: base.religion_id,
        date_of_birth: base.date_of_birth,
        birth_time: "06:30",
        birth_city: "Bengaluru",
        rashi: "Simha (Leo)",
        lagna: "Karka (Cancer)",
        nakshatra: "Magha",
        nakshatra_pada: "2",
        gana: "Dev",
        yoni_animal: "Lion (Simha)",
        manglik: "No",
      },
      lists,
      "faith",
    );
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.data.date_of_birth).toBe("1998-01-15");
      expect(parsed.data.birth_time).toBe("06:30");
      expect(parsed.data.birth_city).toBe("Bengaluru");
      expect(parsed.data.rashi).toBe("Simha (Leo)");
      expect(parsed.data.gana).toBe("Dev");
      expect(parsed.data.yoni_animal).toBe("Lion (Simha)");
      expect(parsed.data.manglik).toBe("No");
    }
  });

  it("requires date of birth on the faith section", () => {
    const parsed = parseProfileForm({ religion_id: base.religion_id }, lists, "faith");
    expect(parsed.ok).toBe(false);
  });

  it("requires time of birth on the faith section", () => {
    const parsed = parseProfileForm(
      {
        religion_id: base.religion_id,
        date_of_birth: base.date_of_birth,
        birth_time: "",
        birth_city: "Chennai",
      },
      lists,
      "faith",
    );
    expect(parsed.ok).toBe(false);
  });

  it("requires city of birth on the faith section", () => {
    const parsed = parseProfileForm(
      {
        religion_id: base.religion_id,
        date_of_birth: base.date_of_birth,
        birth_time: "06:30",
        birth_city: "",
      },
      lists,
      "faith",
    );
    expect(parsed.ok).toBe(false);
  });

  it("allows an empty about so video or voice can be the introduction", () => {
    const parsed = parseProfileForm({ ...base, about: "" }, lists);
    expect(parsed.ok).toBe(true);
    if (parsed.ok) expect(parsed.data.about).toBe("");
  });

  it("still rejects a short about note", () => {
    const parsed = parseProfileForm({ ...base, about: "Too short" }, lists);
    expect(parsed.ok).toBe(false);
  });
});
