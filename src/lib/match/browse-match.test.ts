import { describe, expect, it } from "vitest";
import { browseRank, mergeSmartPicks, parseBrowseView, preferencePoints } from "./browse-match";
import type { MatchSelf } from "@/lib/profile/match-compare";

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

const them: MatchSelf = { ...me, ageYears: 28, currentCity: "Mysuru" };

const myPrefs = {
  pref_age_min: 24,
  pref_age_max: 36,
  pref_height_min: 150,
  pref_height_max: 180,
  pref_maritals: ["never_married"],
  pref_diets: ["Vegetarian"],
  pref_tongues: ["Kannada"],
  pref_religions: ["Hindu"],
  pref_communities: ["Iyer"],
  pref_countries: ["India"],
  pref_states: ["Karnataka"],
  pref_cities: ["Any city"],
  pref_educations: ["Any education"],
  pref_occupations: ["Any occupation"],
  pref_employed: ["Any employment"],
  pref_incomes: ["Any income"],
};

const kundali = {
  rashi: "Simha (Leo)",
  nakshatra: "Magha",
  gana: "Rakshas",
  yoni_animal: "Rat (Mushaka)",
  manglik: "No",
};

describe("browse match views", () => {
  it("defaults to smart picks and maps the old rows onto it", () => {
    expect(parseBrowseView(undefined)).toBe("smart");
    expect(parseBrowseView("fits")).toBe("smart");
    expect(parseBrowseView("prefers")).toBe("smart");
    expect(parseBrowseView("kundali")).toBe("kundali");
    expect(parseBrowseView("more")).toBe("smart");
    expect(parseBrowseView("nearby")).toBe("nearby");
    expect(parseBrowseView("community")).toBe("community");
    expect(parseBrowseView("custom")).toBe("custom");
  });

  it("merges preference rows without duplicating a profile", () => {
    const merged = mergeSmartPicks(
      [
        { id: "a", score: "15/15 of your preference" },
        { id: "b", score: "10/15 of your preference" },
      ],
      [
        { id: "a", score: "12/15 of their preference" },
        { id: "c", score: "14/15 of their preference" },
      ],
    );
    expect(merged.map((row) => row.id)).toEqual(["a", "b", "c"]);
    expect(merged[0]?.score).toMatch(/15\/15 of your preference/);
  });

  it("counts partner-preference points out of 15", () => {
    expect(preferencePoints(myPrefs, them)).toBeGreaterThanOrEqual(10);
  });

  it("passes matching profiles when they hit 10 of your preference", () => {
    const rank = browseRank("fits", myPrefs, them as unknown as Record<string, unknown>, me, them);
    expect(rank.pass).toBe(true);
    expect(rank.label).toMatch(/of your preference/);
  });

  it("passes when you hit 10 of their preference", () => {
    const rank = browseRank("prefers", me as unknown as Record<string, unknown>, myPrefs, me, them);
    expect(rank.pass).toBe(true);
    expect(rank.label).toMatch(/of their preference/);
  });

  it("passes kundali at 18 or above", () => {
    const rank = browseRank("kundali", kundali, kundali, me, them);
    expect(rank.score).toBeGreaterThanOrEqual(18);
    expect(rank.pass).toBe(true);
    expect(rank.label).toMatch(/Kundali/);
  });
});
