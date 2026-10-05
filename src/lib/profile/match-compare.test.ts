import { describe, expect, it } from "vitest";
import {
  formatAgeRange,
  formatHeightRange,
  hopeComparisons,
  listedFits,
  preferenceFits,
  preferenceFitScore,
  preferenceMatchCount,
  preferenceSheetRows,
  rangeFits,
  type MatchSelf,
} from "./match-compare";

const me: MatchSelf = {
  ageYears: 31,
  heightCm: 165,
  maritalStatus: "never_married",
  diet: "Vegetarian",
  motherTongue: "Kannada",
  religionName: "Hindu",
  communityName: "Iyer",
  currentCountry: "India",
  currentState: "Karnataka",
  currentCity: "Bengaluru",
  qualification: "B.E.",
  occupation: "Engineer",
  employedIn: "Private",
  incomeBand: "₹15 lakh to ₹20 lakh",
};

describe("match compare", () => {
  it("fits numeric ranges", () => {
    expect(rangeFits(31, 24, 36)).toBe(true);
    expect(rangeFits(40, 24, 36)).toBe(false);
    expect(rangeFits(null, 24, 36)).toBe(false);
    expect(rangeFits(31, null, 36)).toBe(null);
  });

  it("treats any-label as a match", () => {
    expect(listedFits("Hindu", ["Any religion"], "Any religion")).toBe(true);
    expect(listedFits("Jain", ["Hindu"], "Any religion")).toBe(false);
    expect(listedFits(null, ["Hindu"], "Any religion")).toBe(false);
  });

  it("ticks age and misses marital when the list does not include you", () => {
    const verdict = hopeComparisons(
      {
        pref_age_min: 24,
        pref_age_max: 36,
        pref_height_min: 150,
        pref_height_max: 180,
        pref_maritals: ["divorced"],
        pref_diets: ["Any diet"],
        pref_communities: ["Any community"],
        pref_cities: ["Any city"],
      },
      me,
    );
    expect(verdict.age).toEqual({ match: true, you: "31 years" });
    expect(verdict.height.match).toBe(true);
    expect(verdict.marital.match).toBe(false);
    expect(verdict.horoscope.match).toBe(true);
  });

  it("counts horoscope from Kundali: 18 and above is a match, 17 and below is not", () => {
    expect(hopeComparisons({}, me, 22).horoscope.match).toBe(true);
    expect(hopeComparisons({}, me, 18).horoscope.match).toBe(true);
    expect(hopeComparisons({}, me, 17).horoscope.match).toBe(false);
    expect(hopeComparisons({}, me, 15).horoscope.match).toBe(false);
    const fifteen = hopeComparisons(
      {
        pref_age_min: 24,
        pref_age_max: 36,
        pref_height_min: 150,
        pref_height_max: 180,
      },
      me,
      22,
    );
    expect(Object.keys(fifteen)).toHaveLength(15);
    expect(preferenceFitScore(Object.values(fifteen)).total).toBe(15);
  });

  it("prints height as feet and centimetres", () => {
    expect(formatHeightRange(170, 185)).toBe(`5' 7" (170cm) to 6' 1" (185cm)`);
    expect(formatAgeRange(34, 38)).toBe("34 to 38");
  });

  it("lists every preference row with a match count", () => {
    const rows = preferenceSheetRows(
      {
        pref_age_min: 24,
        pref_age_max: 36,
        pref_height_min: 150,
        pref_height_max: 180,
        pref_maritals: ["never_married"],
        pref_religions: ["Hindu"],
        pref_communities: ["Iyer"],
        pref_tongues: ["Kannada"],
        pref_countries: ["India"],
        pref_states: ["Maharashtra"],
        pref_cities: ["Mumbai"],
        pref_educations: ["Doctorate"],
        pref_incomes: ["Any income"],
      },
      me,
    );
    expect(rows.map((r) => r.k)).toEqual([
      "Age",
      "Height",
      "Marital Status",
      "Diet",
      "Horoscopic match",
      "Mother Tongue",
      "Religion",
      "Community / caste",
      "Country Living in",
      "State Living in",
      "City Living in",
      "Qualification",
      "Working as",
      "Employed in",
      "Annual Income",
    ]);
    expect(rows[0]).toMatchObject({ k: "Age", match: true });
    expect(rows.find((r) => r.k === "Religion")?.match).toBe(true);
    expect(rows.find((r) => r.k === "State Living in")?.match).toBe(false);
    expect(preferenceMatchCount(rows).total).toBe(15);
    expect(preferenceFitScore(rows)).toEqual(preferenceMatchCount(rows));
  });

  it("scores only preference rows that can be judged", () => {
    expect(
      preferenceFitScore([
        { match: true },
        { match: false },
        { match: null },
      ]),
    ).toEqual({ hit: 1, total: 2 });
  });

  it("treats a false preference as a miss for match alerts", () => {
    expect(preferenceFits({ pref_age_min: 24, pref_age_max: 36 }, me)).toBe(true);
    expect(preferenceFits({ pref_age_min: 40, pref_age_max: 45 }, me)).toBe(false);
  });
});
