import { describe, expect, it } from "vitest";
import { isPlanCode, mapPlanRow, parsePerks, planBenefitLines, slugPlanCode } from "./catalog";

describe("plan catalog", () => {
  it("slugs and rejects reserved codes", () => {
    expect(slugPlanCode(" Gold Plus ")).toBe("gold-plus");
    expect(isPlanCode("gold")).toBe(true);
    expect(isPlanCode("welcome")).toBe(false);
  });

  it("maps a desk row including perks", () => {
    const plan = mapPlanRow({
      code: "pearl",
      name: "Pearl",
      tagline: "Nine months",
      months: 9,
      price_inr: 3299,
      featured: true,
      for_sale: true,
      sort_order: 4,
      perks: "Chat\nBrowse",
    });
    expect(plan?.code).toBe("pearl");
    expect(plan?.interestLimit).toBe(80);
    expect(parsePerks("Chat\nBrowse")).toEqual(["Chat", "Browse"]);
    expect(plan?.featured).toBe(true);
  });

  it("lists four live benefits including chat on send", () => {
    const lines = planBenefitLines(20);
    expect(lines).toHaveLength(4);
    expect(lines[1]).toMatch(/chat as soon as you send interest/i);
    expect(lines[0]).toContain("20");
  });
});
