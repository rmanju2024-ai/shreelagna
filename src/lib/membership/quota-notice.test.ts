import { describe, expect, it } from "vitest";
import { buildQuotaSoftNotice } from "./quota-notice";
import { resolveQuota } from "./quota";

describe("quota soft notice", () => {
  it("skips house cover", () => {
    expect(
      buildQuotaSoftNotice({ kind: "house", live: true, daysLeft: 0 }, resolveQuota(null, 3), "visit"),
    ).toBeNull();
  });

  it("warns when five families remain", () => {
    const note = buildQuotaSoftNotice(
      { kind: "welcome", live: true, daysLeft: 40, label: "Welcome gift", until: new Date("2027-01-02T18:30:00.000Z") },
      resolveQuota(20, 15, [], 1),
      "visit",
      { name: "Jayesh Kumar" },
    );
    expect(note?.kind).toBe("warn");
    expect(note?.title).toBe("Welcome gift");
    expect(note?.who).toBe("Jayesh");
    expect(note?.points).toEqual([
      "Expires 3 Jan 2027",
      "15 of 20 families used",
      "5 new families a day",
    ]);
  });

  it("explains the daily five", () => {
    const note = buildQuotaSoftNotice(
      { kind: "welcome", live: true, daysLeft: 12, label: "Welcome gift" },
      resolveQuota(20, 8, [], 5),
      "daily",
      { name: "Jayesh" },
    );
    expect(note?.kind).toBe("daily");
    expect(note?.title).toBe("Welcome gift");
    expect(note?.who).toBe("Jayesh");
    expect(note?.points).toContain("8 of 20 families used");
    expect(note?.points).toContain("Today's 5 new families are used");
  });
});
