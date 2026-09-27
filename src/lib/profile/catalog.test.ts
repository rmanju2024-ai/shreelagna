import { describe, expect, it } from "vitest";
import { CITIES_BY_STATE, HOPE_INCOME_BANDS, INCOME_BANDS } from "./catalog";
import { INDIAN_STATES } from "./options";

describe("INCOME_BANDS", () => {
  it("has one category every 5 lakh up to 1 crore", () => {
    expect(INCOME_BANDS[0]).toBe("Prefer not to say");
    expect(INCOME_BANDS[1]).toBe("Student / not earning");
    expect(INCOME_BANDS[2]).toBe("Up to ₹5 lakh");
    expect(INCOME_BANDS).toContain("₹10–15 lakh");
    expect(INCOME_BANDS).toContain("₹45–50 lakh");
    expect(INCOME_BANDS).toContain("₹95 lakh–₹1 crore");
    expect(INCOME_BANDS.at(-1)).toBe("Above ₹1 crore");
    expect(INCOME_BANDS).toHaveLength(23);
  });
});

describe("CITIES_BY_STATE", () => {
  it("covers every Indian state and union territory, with real cities only", () => {
    expect(Object.keys(CITIES_BY_STATE).sort()).toEqual([...INDIAN_STATES].sort());
    expect(INDIAN_STATES).not.toContain("Other");
    expect(CITIES_BY_STATE.Karnataka).not.toContain("Whitefield");
    expect(CITIES_BY_STATE.Karnataka).toContain("Bengaluru");
    expect(CITIES_BY_STATE.Delhi).toEqual(["Delhi", "New Delhi"]);
    expect(CITIES_BY_STATE["Andhra Pradesh"]).toContain("Amaravati");
    expect(CITIES_BY_STATE["Andhra Pradesh"]).toContain("Adoni");
    expect(CITIES_BY_STATE["Andhra Pradesh"]).toContain("Bhimavaram");
    expect(CITIES_BY_STATE["Andhra Pradesh"]).not.toContain("Bheemavaram");
    expect(CITIES_BY_STATE["Andhra Pradesh"]).toContain("Akividu");
    expect(CITIES_BY_STATE["Andhra Pradesh"]).not.toContain("Akiveedu");
    expect(CITIES_BY_STATE["Andhra Pradesh"]).toContain("Chilakaluripet");
    expect(CITIES_BY_STATE["Andhra Pradesh"]).not.toContain("Chilakaluripeta");
    expect(CITIES_BY_STATE.Karnataka).not.toContain("Bangalore");
    expect(CITIES_BY_STATE["Andhra Pradesh"].length).toBeGreaterThan(180);
    expect(CITIES_BY_STATE.Karnataka.length).toBeGreaterThan(80);
    expect(CITIES_BY_STATE.Maharashtra.length).toBeGreaterThan(80);
    expect(CITIES_BY_STATE["Tamil Nadu"].length).toBeGreaterThan(80);
    expect(CITIES_BY_STATE["Uttar Pradesh"].length).toBeGreaterThan(80);
    expect(CITIES_BY_STATE.Kerala).not.toContain("Idukki");
    expect(CITIES_BY_STATE.Maharashtra).toContain("Vasai-Virar");
    const allCities = Object.values(CITIES_BY_STATE).flat();
    expect(allCities).not.toContain("Abroad");
    expect(allCities).not.toContain("USA");
    expect(allCities).not.toContain("Gulf");
  });
});

describe("HOPE_INCOME_BANDS", () => {
  it("uses a greater-than floor and omits student and prefer not to say", () => {
    expect(HOPE_INCOME_BANDS[0]).toBe("Greater than ₹5 lakh");
    expect(HOPE_INCOME_BANDS).toContain("Greater than ₹15 lakh");
    expect(HOPE_INCOME_BANDS).not.toContain("Prefer not to say");
    expect(HOPE_INCOME_BANDS).not.toContain("Student / not earning");
  });
});
