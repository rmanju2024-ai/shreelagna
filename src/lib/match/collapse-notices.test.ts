import { describe, expect, it } from "vitest";
import { collapseNotices, noticesForActiveProfiles } from "./collapse-notices";

describe("collapse notices", () => {
  it("keeps one profile-view alert per person", () => {
    const rows = collapseNotices([
      { id: "2", kind: "profile_view", match_profile_id: "manju", created_at: "2026-09-24T17:31:00Z" },
      { id: "1", kind: "profile_view", match_profile_id: "manju", created_at: "2026-09-24T13:55:00Z" },
      { id: "3", kind: "interest_received", match_profile_id: "manju", created_at: "2026-09-24T12:00:00Z" },
    ]);
    expect(rows.map((row) => row.id)).toEqual(["2", "3"]);
  });

  it("keeps one shortlist alert per person", () => {
    const rows = collapseNotices([
      { id: "n2", kind: "shortlist", match_profile_id: "manju", created_at: "2026-09-25T11:00:00Z" },
      { id: "n1", kind: "shortlist", match_profile_id: "manju", created_at: "2026-09-25T10:00:00Z" },
    ]);
    expect(rows.map((row) => row.id)).toEqual(["n2"]);
  });

  it("keeps one contact-view alert per person", () => {
    const rows = collapseNotices([
      { id: "b", kind: "contact_view", match_profile_id: "manju", created_at: "2026-09-25T10:00:00Z" },
      { id: "a", kind: "contact_view", match_profile_id: "manju", created_at: "2026-09-25T09:00:00Z" },
    ]);
    expect(rows.map((row) => row.id)).toEqual(["b"]);
  });

  it("removes alerts for hidden profiles but keeps system alerts", () => {
    const rows = [
      { id: "active", match_profile_id: "p1" },
      { id: "hidden", match_profile_id: "p2" },
      { id: "system", match_profile_id: null },
    ];
    expect(noticesForActiveProfiles(rows, new Set(["p1"])).map((row) => row.id)).toEqual([
      "active",
      "system",
    ]);
  });
});
