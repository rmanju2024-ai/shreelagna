import { describe, expect, it } from "vitest";
import { browseRank, parseBrowseView, preferencePoints } from "./browse-match";
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
  it("defaults to matching your preference", () => {
    expect(parseBrowseView(undefined)).toBe("fits");
    expect(parseBrowseView("kundali")).toBe("kundali");
    expect(parseBrowseView("more")).toBe("fits");
    expect(parseBrowseView("nearby")).toBe("nearby");
    expect(parseBrowseView("community")).toBe("community");
    expect(parseBrowseView("viewed_you")).toBe("viewed_you");
    expect(parseBrowseView("you_viewed")).toBe("you_viewed");
    expect(parseBrowseView("custom")).toBe("custom");
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
