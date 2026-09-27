import { describe, expect, it } from "vitest";
import { kundaliScore } from "./kundali";

describe("kundali score", () => {
  it("scores a complete pair out of 36", () => {
    const score = kundaliScore(
      {
        rashi: "Simha (Leo)",
        nakshatra: "Magha",
        gana: "Rakshas",
        yoni: "Rat (Mushaka)",
        manglik: "No",
      },
      {
        rashi: "Simha (Leo)",
        nakshatra: "Magha",
        gana: "Rakshas",
        yoni: "Rat (Mushaka)",
        manglik: "No",
      },
    );
    expect(score.max).toBe(36);
    expect(score.total).toBeGreaterThanOrEqual(24);
    expect(score.label).toBe("Favourable");
  });

  it("drops points when mangalik differs", () => {
    const same = kundaliScore({ manglik: "No" }, { manglik: "No" });
    const mixed = kundaliScore({ manglik: "Yes" }, { manglik: "No" });
    expect(same.parts.find((p) => p.k === "Mangalik")?.score).toBe(8);
    expect(mixed.parts.find((p) => p.k === "Mangalik")?.score).toBe(2);
  });
});
