import { describe, expect, it } from "vitest";
import {
  complimentaryPaidProfileAccess,
  daysLeft,
  pairPlanLive,
  resolveMembership,
  welcomeUntil,
} from "./access";

const start = "2026-01-01T00:00:00.000Z";

describe("membership access", () => {
  it("gives two months from joining with no purchase", () => {
    const until = welcomeUntil(start, 61, new Date(start));
    expect(until?.toISOString()).toBe("2026-03-03T00:00:00.000Z");
    const gift = resolveMembership({
      role: "member",
      welcomeStartedAt: start,
      welcomeDays: 61,
      now: new Date("2026-02-01T00:00:00.000Z"),
    });
    expect(gift.kind).toBe("welcome");
    expect(gift.live).toBe(true);
    expect(gift.daysLeft).toBe(30);
  });

  it("lets a paid plan take over during welcome", () => {
    const paid = resolveMembership({
      role: "member",
      welcomeStartedAt: start,
      welcomeDays: 61,
      paid: {
        plan_code: "gold",
        status: "active",
        ends_at: "2026-08-01T00:00:00.000Z",
      },
      now: new Date("2026-02-01T00:00:00.000Z"),
    });
    expect(paid.kind).toBe("paid");
    expect(paid.label).toBe("Gold plan");
    expect(paid.live).toBe(true);
  });

  it("asks for a plan after welcome if nothing is paid", () => {
    const none = resolveMembership({
      role: "member",
      welcomeStartedAt: start,
      welcomeDays: 61,
      now: new Date("2026-04-01T00:00:00.000Z"),
    });
    expect(none.kind).toBe("none");
    expect(none.live).toBe(false);
    expect(daysLeft(none.until, new Date("2026-04-01T00:00:00.000Z"))).toBe(0);
  });

  it("keeps staff and admin on house access", () => {
    expect(resolveMembership({ role: "admin" }).kind).toBe("house");
    expect(resolveMembership({ role: "service" }).live).toBe(true);
  });

  it("opens a paid profile to a free member when interest is open", () => {
    expect(
      complimentaryPaidProfileAccess({ viewerKind: "none", targetKind: "paid", interestOpen: true }),
    ).toBe(true);
    expect(
      complimentaryPaidProfileAccess({ viewerKind: "welcome", targetKind: "paid", interestOpen: true }),
    ).toBe(true);
    expect(
      complimentaryPaidProfileAccess({ viewerKind: "none", targetKind: "paid", interestOpen: false }),
    ).toBe(false);
    expect(
      complimentaryPaidProfileAccess({ viewerKind: "none", targetKind: "welcome", interestOpen: true }),
    ).toBe(false);
    expect(
      complimentaryPaidProfileAccess({ viewerKind: "paid", targetKind: "paid", interestOpen: true }),
    ).toBe(false);
    expect(
      complimentaryPaidProfileAccess({
        viewerKind: "none",
        targetKind: "paid",
        interestOpen: true,
        pairLive: false,
      }),
    ).toBe(false);
    expect(pairPlanLive(true, false)).toBe(true);
    expect(pairPlanLive(false, true)).toBe(true);
    expect(pairPlanLive(false, false)).toBe(false);
  });
});
