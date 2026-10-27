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

  it("lists other named catalogs A to Z", () => {
    const lists = enrichFormLists(listsFromSeed());
    const alpha = (values: string[]) =>
      [...values].sort((a, b) => a.localeCompare(b, "en", { sensitivity: "base" }));
    expect(lists.employedIn).toEqual(alpha(lists.employedIn));
    expect(lists.tongues).toEqual(alpha(lists.tongues));
    expect(lists.diets).toEqual(alpha(lists.diets));
    expect(lists.hobbies).toEqual(alpha(lists.hobbies));
    expect(lists.residency).toEqual(alpha(lists.residency));
    expect(lists.countries[0]).toBe("India");
    expect(lists.countries.slice(1)).toEqual(alpha(lists.countries.slice(1)));
    expect(lists.yoniAnimals[0]).toBe("Don't know");
    expect(lists.yoniAnimals.slice(1)).toEqual(alpha(lists.yoniAnimals.slice(1)));
    expect(lists.gotras[0]).toBe("Don't know");
    expect(lists.gotras.slice(1)).toEqual(alpha(lists.gotras.slice(1)));
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
