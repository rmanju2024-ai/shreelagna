import { describe, expect, it } from "vitest";
import { activityTier, incomeRank, sortByPriority, type BrowsePriority } from "./browse-priority";

const now = Date.parse("2026-10-04T00:00:00Z");
const p = (o: Partial<BrowsePriority>): BrowsePriority => ({
  subscribed: false,
  complete: false,
  nearbyKm: 999,
  activity: 0,
  income: 0,
  ageGap: 0,
  ...o,
});

describe("browse priority", () => {
  it("tiers activity and ignores hidden last seen", () => {
    expect(activityTier("2026-10-03T00:00:00Z", false, now)).toBe(2);
    expect(activityTier("2026-09-20T00:00:00Z", false, now)).toBe(1);
    expect(activityTier("2026-01-01T00:00:00Z", false, now)).toBe(0);
    expect(activityTier("2026-10-03T00:00:00Z", true, now)).toBe(0);
  });

  it("ranks income bands", () => {
    expect(incomeRank("₹10–15 lakh")).toBe(15);
    expect(incomeRank("₹1+ crore")).toBe(100);
    expect(incomeRank(null)).toBe(0);
  });

  it("orders paid, complete, nearby, then activity, income, age", () => {
    const map = new Map<string, BrowsePriority>([
      ["plain", p({})],
      ["age", p({ income: 10, ageGap: 5 })],
      ["income", p({ income: 20 })],
      ["active", p({ activity: 1 })],
      ["very", p({ activity: 2 })],
      ["near", p({ nearbyKm: 12 })],
      ["done", p({ complete: true })],
      ["paid", p({ subscribed: true })],
    ]);
    const out = sortByPriority([...map.keys()].map((id) => ({ id })), map).map((r) => r.id);
    expect(out).toEqual(["paid", "done", "near", "very", "active", "income", "age", "plain"]);
  });
});
