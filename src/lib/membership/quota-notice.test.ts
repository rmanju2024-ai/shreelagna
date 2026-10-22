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
      { kind: "welcome", live: true, daysLeft: 40 },
      resolveQuota(20, 15, [], 1),
      "visit",
    );
    expect(note?.kind).toBe("warn");
    expect(note?.body).toContain("5 families remaining");
    expect(note?.body).toContain("40 days left");
  });

  it("explains the daily five", () => {
    const note = buildQuotaSoftNotice(
      { kind: "welcome", live: true, daysLeft: 12 },
      resolveQuota(20, 8, [], 5),
      "daily",
    );
    expect(note?.kind).toBe("daily");
    expect(note?.title.toLowerCase()).toContain("five");
  });
});
