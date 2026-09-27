import { describe, expect, it } from "vitest";
import { isWithinKm, kmApart, nearbyLabel, sameCommunity } from "./city-distance";

describe("city distance", () => {
  it("treats the same city as 0 km", () => {
    expect(kmApart({ city: "Bengaluru" }, { city: "Bangalore" })).toBe(0);
    expect(isWithinKm({ city: "Bengaluru" }, { city: "Bengaluru" })).toBe(true);
    expect(nearbyLabel(0)).toBe("Same city");
  });

  it("keeps Hosur inside 100 km of Bengaluru and Mysuru outside", () => {
    const hosur = kmApart({ city: "Bengaluru" }, { city: "Hosur" });
    const mysuru = kmApart({ city: "Bengaluru" }, { city: "Mysuru" });
    expect(hosur).toBeGreaterThan(20);
    expect(hosur).toBeLessThan(50);
    expect(isWithinKm({ city: "Bengaluru" }, { city: "Hosur" })).toBe(true);
    expect(mysuru).toBeGreaterThan(100);
    expect(isWithinKm({ city: "Bengaluru" }, { city: "Mysuru" })).toBe(false);
  });

  it("does not guess when a town has no coordinates", () => {
    expect(kmApart({ city: "Bengaluru" }, { city: "A tiny unknown hamlet" })).toBeNull();
    expect(isWithinKm({ city: "Bengaluru" }, { city: "A tiny unknown hamlet" })).toBe(false);
  });

  it("matches community names without case", () => {
    expect(sameCommunity("Iyer", "iyer")).toBe(true);
    expect(sameCommunity("Iyer", "Iyengar")).toBe(false);
    expect(sameCommunity("", "Iyer")).toBe(false);
  });
});
