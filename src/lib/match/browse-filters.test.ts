import { describe, expect, it } from "vitest";
import {
  browseFilterQuery,
  namedBrowseFilter,
  parseBrowseFilters,
  profileFitsBrowse,
  readSavedBrowseFilters,
} from "./browse-filters";

describe("browse filters", () => {
  const row = {
    date_of_birth: "1996-06-01",
    current_country: "India",
    current_state: "Karnataka",
    current_city: "Bengaluru",
    religion_name: "Hindu",
    community_name: "Iyer",
    diet: "Vegetarian",
    qualification: "B.E. / B.Tech",
    income_band: "₹15–20 lakh",
  };

  it("parses query params", () => {
    expect(parseBrowseFilters({ age_min: "25", city: " Bengaluru ", country: "India" })).toEqual({
      ageMin: 25,
      ageMax: null,
      country: ["India"],
      state: [],
      city: ["Bengaluru"],
      religion: [],
      community: [],
      lifestyle: [],
      education: [],
      income: [],
    });
  });

  it("parses several choices", () => {
    expect(parseBrowseFilters({ religion: "Hindu|Jain", city: "Bengaluru,Mysuru" }).religion).toEqual(["Hindu", "Jain"]);
    expect(parseBrowseFilters({ city: "Bengaluru|Mysuru" }).city).toEqual(["Bengaluru", "Mysuru"]);
  });

  it("matches place, faith, lifestyle and income", () => {
    expect(profileFitsBrowse(row, parseBrowseFilters({ age_min: "25", age_max: "35" }))).toBe(true);
    expect(profileFitsBrowse(row, parseBrowseFilters({ country: "india", state: "Karnataka", city: "Bengaluru" }))).toBe(
      true,
    );
    expect(profileFitsBrowse(row, parseBrowseFilters({ city: "Mysuru" }))).toBe(false);
    expect(profileFitsBrowse(row, parseBrowseFilters({ city: "Mysuru|Bengaluru" }))).toBe(true);
    expect(profileFitsBrowse(row, parseBrowseFilters({ education: "MBA" }))).toBe(false);
    expect(
      profileFitsBrowse(
        row,
        parseBrowseFilters({ religion: "Hindu", community: "Iyer", lifestyle: "Vegetarian", income: "₹15–20 lakh" }),
      ),
    ).toBe(true);
  });

  it("names a custom filter and round-trips saved JSON", () => {
    const saved = namedBrowseFilter("  Bengaluru 25-32  ", parseBrowseFilters({ age_min: "25", age_max: "32", city: "Bengaluru" }));
    expect(saved?.name).toBe("Bengaluru 25-32");
    expect(browseFilterQuery(saved!)).toEqual({ age_min: "25", age_max: "32", city: "Bengaluru" });
    expect(namedBrowseFilter("Empty", parseBrowseFilters({}))).toBeNull();
    const list = readSavedBrowseFilters(JSON.stringify([saved]));
    expect(list).toHaveLength(1);
    expect(list[0].name).toBe("Bengaluru 25-32");
    expect(list[0].city).toEqual(["Bengaluru"]);
  });
});
