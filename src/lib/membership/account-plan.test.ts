import { describe, expect, it } from "vitest";
import { planDaysLine, planQuotaLine, planWaitingLine } from "./account-plan";

describe("account hub plan copy", () => {
  it("says what is waiting", () => {
    expect(planWaitingLine({ live: false })).toBe("Waiting for a live plan.");
    expect(planWaitingLine({ live: true, pendingName: "Gold" })).toBe("Waiting for Gold to be activated.");
    expect(planWaitingLine({ live: true })).toBe("Nothing waiting.");
  });

  it("states chat and request usage", () => {
    expect(planQuotaLine({ used: 4, limit: 20 })).toBe("Chat & requests: 4 used of 20.");
    expect(planQuotaLine({ used: 0, limit: null })).toBe("Chat & requests: no cap on this cover.");
  });

  it("states remaining days", () => {
    expect(planDaysLine({ live: true, daysLeft: 12, kind: "paid" })).toBe("12 days left.");
    expect(planDaysLine({ live: false, daysLeft: 0, kind: "none" })).toBe("0 days left.");
    expect(planDaysLine({ live: true, daysLeft: 0, kind: "house" })).toBe("House cover has no end date.");
  });
});
