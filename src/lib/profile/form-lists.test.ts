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
    const seed = listsFromSeed();
    expect(seed.countries).toContain("India");
    expect(seed.gotras[0]).toBe("Don't know");
    expect(seed.yoniAnimals).toHaveLength(14);
    expect(seed.hopeIncomes.length).toBeGreaterThan(5);
    expect(seed.bloodGroups).toContain("O+");
    expect(seed.occupations).toContain("Accountant");
    expect(seed.occupations).toContain("Other profession");
    expect(seed.employedIn).toContain("Family business");
    const lists = enrichFormLists(seed);
    expect(lists.nakshatraPadas[0]).toBe("Don't know");
    expect(lists.rashis[0]).toBe("Don't know");
    expect(lists.ganas[0]).toBe("Don't know");
    expect(lists.yoniAnimals[0]).toBe("Don't know");
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
