import { describe, expect, it } from "vitest";
import { interestLimitFor, resolveQuota, usedInterestsSince } from "./quota";

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

  it("leaves house access unlimited", () => {
    expect(interestLimitFor("house")).toBeNull();
    expect(resolveQuota(null, 500).canSend).toBe(true);
  });
});
