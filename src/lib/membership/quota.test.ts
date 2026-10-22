import { describe, expect, it } from "vitest";
import {
  DAILY_NEW_FAMILY_CAP,
  interestLimitFor,
  newFamiliesOnDay,
  periodWarns,
  resolveQuota,
  usedInterestsSince,
  usedUniqueProfilesSince,
  withBonusSlots,
} from "./quota";

describe("interest quota", () => {
  it("caps welcome at 20", () => {
    expect(interestLimitFor("welcome")).toBe(20);
    expect(resolveQuota(20, 20).canSend).toBe(false);
    expect(resolveQuota(20, 7).left).toBe(13);
  });

  it("counts only interests this member sent after the window start", () => {
    const used = usedInterestsSince(
      [
        { from_profile_id: "me", created_at: "2026-01-10T00:00:00.000Z" },
        { from_profile_id: "me", created_at: "2025-12-01T00:00:00.000Z" },
        { from_profile_id: "other", created_at: "2026-01-10T00:00:00.000Z" },
      ],
      ["me"],
      new Date("2026-01-01T00:00:00.000Z"),
    );
    expect(used).toBe(1);
    const views = usedInterestsSince(
      [{ from_profile_id: "me", created_at: "2026-01-10T00:00:00.000Z" }],
      ["me"],
      new Date("2026-01-01T00:00:00.000Z"),
    );
    expect(used + views).toBe(2);
  });

  it("counts a send and a contact view on the same profile as one", () => {
    const ids = usedUniqueProfilesSince(
      [{ from_profile_id: "me", to_profile_id: "them", created_at: "2026-01-10T00:00:00.000Z" }],
      [{ viewer_profile_id: "me", viewed_profile_id: "them", created_at: "2026-01-11T00:00:00.000Z" }],
      ["me"],
      new Date("2026-01-01T00:00:00.000Z"),
    );
    expect(ids).toEqual(["them"]);
  });

  it("leaves house access unlimited", () => {
    expect(interestLimitFor("house")).toBeNull();
    expect(resolveQuota(null, 500).canSend).toBe(true);
    expect(resolveQuota(null, 500).dailyLimit).toBeNull();
  });

  it("caps five new families a day and warns with five left", () => {
    const mid = resolveQuota(20, 15, [], 3);
    expect(mid.left).toBe(5);
    expect(periodWarns(mid)).toBe(true);
    expect(mid.dailyLeft).toBe(2);
    const dayFull = resolveQuota(20, 10, [], DAILY_NEW_FAMILY_CAP);
    expect(dayFull.canSend).toBe(false);
    expect(dayFull.left).toBe(10);
    expect(withBonusSlots(20, 5)).toBe(25);
  });

  it("counts only first-touch families toward the daily five", () => {
    const ids = newFamiliesOnDay(
      [{ from_profile_id: "me", to_profile_id: "new", created_at: "2026-01-10T08:00:00.000Z" }],
      [{ viewer_profile_id: "me", viewed_profile_id: "old", created_at: "2026-01-08T08:00:00.000Z" }],
      ["me"],
      new Date("2026-01-10T00:00:00.000Z"),
      new Date("2026-01-01T00:00:00.000Z"),
    );
    expect(ids).toEqual(["new"]);
  });
});
