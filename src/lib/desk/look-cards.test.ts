import { describe, expect, it } from "vitest";
import { lookCardFromRow, lookStatusLine, subscribedOwnerIds } from "./look-cards";

describe("desk look cards", () => {
  it("labels review and hidden rows for staff", () => {
    expect(lookStatusLine("pending_review")).toBe("In review");
    expect(lookStatusLine("hidden")).toBe("Hidden");
    expect(lookStatusLine("active")).toBe("");
  });

  it("treats live memberships as subscribed", () => {
    const now = Date.parse("2026-10-06T00:00:00Z");
    expect(
      subscribedOwnerIds(
        [
          { user_id: "a", ends_at: "2026-12-01T00:00:00Z" },
          { user_id: "b", ends_at: "2026-01-01T00:00:00Z" },
          { user_id: "c", ends_at: null },
        ],
        now,
      ),
    ).toEqual(new Set(["a", "c"]));
  });

  it("maps a row onto a Look card", () => {
    const card = lookCardFromRow(
      {
        id: "p1",
        subject_full_name: "Ananya Rao",
        profile_type: "vadhu",
        status: "pending_review",
        current_city: "Bengaluru",
        current_state: "Karnataka",
        subscribed: true,
        date_of_birth: "1996-01-15",
      },
      new Map(),
      Date.parse("2026-10-06T00:00:00Z"),
    );
    expect(card.name).toBe("Ananya");
    expect(card.href).toBe("/browse/p1?from=look");
    expect(card.lastOnline).toBe("In review");
    expect(card.subscribed).toBe(true);
    expect(card.profile_type).toBe("vadhu");
  });
});
