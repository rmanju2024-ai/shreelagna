import { describe, expect, it } from "vitest";
import { houseReading, nextHouseAction, portraitReadiness } from "./house-insight";

describe("portraitReadiness", () => {
  it("is ready when nothing is missing", () => {
    expect(portraitReadiness(0)).toEqual({ percent: 100, label: "Ready for families" });
  });

  it("drops when a photograph is still needed", () => {
    const ready = portraitReadiness(1);
    expect(ready.percent).toBeLessThan(100);
    expect(ready.percent).toBeGreaterThan(80);
  });
});

describe("houseReading", () => {
  it("writes a place and work note from stored fields", () => {
    const notes = houseReading({
      profileType: "vara",
      dateOfBirth: "1995-06-15",
      currentCity: "Chennai",
      nativeState: "Tamil Nadu",
      qualification: "Graduate",
      occupation: "Software professional",
      hasPhoto: false,
    });
    expect(notes.some((n) => n.includes("Chennai"))).toBe(true);
    expect(notes.some((n) => n.includes("photograph"))).toBe(true);
    expect(notes.some((n) => n.toLowerCase().includes("software"))).toBe(true);
    expect(notes.some((n) => n.includes("Graduate"))).toBe(false);
  });
});

describe("nextHouseAction", () => {
  it("asks for a photograph first when that gap is open", () => {
    const next = nextHouseAction([{ key: "photo", label: "A photograph" }]);
    expect(next.title).toBe("Add a photograph");
    expect(next.hrefSuffix).toBe("?edit=1&section=album#album");
  });

  it("sends a complete portrait to browse", () => {
    expect(nextHouseAction([]).hrefSuffix).toBe("/browse");
  });
});
