import { describe, expect, it } from "vitest";
import { auditDetails, formatAuditCsvRow, toCsv } from "./audit-log";

describe("desk audit log", () => {
  it("flattens useful metadata for the details column", () => {
    expect(auditDetails({ status: "active", field: "about", junk: true })).toBe("Status active · Field about");
    expect(auditDetails({ status: "approved" }, { title: "Kavya · SL-1", email: "k@test", place: "Mysuru", plan: "Gold" })).toBe(
      "Profile Kavya · SL-1 · Gmail k@test · Place Mysuru · Plan Gold · Status approved",
    );
    expect(auditDetails(null)).toBe("");
  });

  it("builds a CSV row with actor, action, and entity", () => {
    const row = formatAuditCsvRow(
      {
        id: 12,
        at: "2026-09-25T10:00:00.000Z",
        actor_user_id: "u1",
        actor_role: "service",
        action: "profile.status",
        entity_type: "profile",
        entity_id: "p-123",
        metadata: { status: "on_hold" },
      },
      { id: "u1", display_name: "Kavya", email: "kavya@house.test" },
    );
    expect(row).toEqual([
      "12",
      expect.stringContaining("IST"),
      "2026-09-25T10:00:00.000Z",
      "Kavya",
      "kavya@house.test",
      "Staff",
      "profile.status",
      "Profile status",
      "profile",
      "p-123",
      "Status on_hold",
    ]);
  });

  it("escapes commas and quotes in CSV", () => {
    const csv = toCsv(["Name", "Note"], [["Kavya", 'said "hello", then left']]);
    expect(csv).toBe('Name,Note\r\nKavya,"said ""hello"", then left"\r\n');
  });
});
