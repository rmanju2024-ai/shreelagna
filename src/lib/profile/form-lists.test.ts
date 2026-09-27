import { describe, expect, it } from "vitest";
import { enrichFormLists, listsFromSeed } from "./form-lists-seed";

describe("form lists", () => {
  it("lists occupations A to Z", () => {
    const lists = enrichFormLists(listsFromSeed());
    const sorted = [...lists.occupations].sort((a, b) =>
      a.localeCompare(b, "en", { sensitivity: "base" }),
    );
    expect(lists.occupations).toEqual(sorted);
  });

  it("keeps seed catalogs for every registration list", () => {
    const lists = listsFromSeed();
    expect(lists.countries).toContain("India");
    expect(lists.gotras[0]).toBe("Don't know");
    expect(lists.yoniAnimals).toHaveLength(14);
    expect(lists.hopeIncomes.length).toBeGreaterThan(5);
    expect(lists.bloodGroups).toContain("O+");
  });

  it("uses loaded catalogs instead of seed when present", () => {
    const lists = enrichFormLists({
      ...listsFromSeed(),
      occupations: ["Pilot"],
      countries: ["India", "Nepal"],
    });
    expect(lists.occupations).toEqual(["Pilot"]);
    expect(lists.countries).toEqual(["India", "Nepal"]);
  });
});
