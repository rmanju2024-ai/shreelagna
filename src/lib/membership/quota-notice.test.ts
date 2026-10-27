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
      { kind: "welcome", live: true, daysLeft: 40, label: "Welcome gift" },
      resolveQuota(20, 15, [], 1),
      "visit",
      { name: "Jayesh Kumar" },
    );
    expect(note?.kind).toBe("warn");
    expect(note?.title).toBe("Dear Jayesh,");
    expect(note?.body).toContain("Welcome gift");
    expect(note?.body).toContain("5 of 20 families available");
    expect(note?.body).toContain("40 days left");
    expect(note?.body).toContain("up to 5 new families");
  });

  it("explains the daily five", () => {
    const note = buildQuotaSoftNotice(
      { kind: "welcome", live: true, daysLeft: 12, label: "Welcome gift" },
      resolveQuota(20, 8, [], 5),
      "daily",
      { name: "Jayesh" },
    );
    expect(note?.kind).toBe("daily");
    expect(note?.title).toBe("Dear Jayesh,");
    expect(note?.body).toContain("Welcome gift");
    expect(note?.body).toMatch(/today'?s 5 are used/i);
  });
});
