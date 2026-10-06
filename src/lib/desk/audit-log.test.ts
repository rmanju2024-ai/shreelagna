import { describe, expect, it } from "vitest";
import { auditDetails, formatAuditCsvRow, toCsv } from "./audit-log";

describe("desk audit log", () => {
  it("puts the action and member in details without repeating other columns", () => {
    expect(auditDetails({ status: "active", field: "about", junk: true })).toBe("active · field about");
    expect(
      auditDetails(
        { action: "verification.case.review", entity_type: "verification_case", metadata: { status: "approved", documentType: "identity" } },
        { title: "Kavya · SL-1 · Bride", email: "k@test", place: "Mysuru" },
      ),
    ).toBe("approved · identity document · on Kavya · SL-1 · Bride · Mysuru");
    expect(auditDetails(null)).toBe("");
  });

  it("names who accepted interest on which profile", () => {
    expect(
      auditDetails(
        {
          action: "interest.accepted",
          entity_type: "interest",
          metadata: { from: "a", to: "b" },
        },
        { fromTitle: "Jayesh · SL010003 · Groom", toTitle: "Manjunatha R · SL010002 · Groom" },
      ),
    ).toBe("Manjunatha R · SL010002 · Groom accepted interest from Jayesh · SL010003 · Groom");
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
      { title: "Kavya · SL-1 · Bride" },
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
      "Kavya · SL-1 · Bride",
      "on hold · on Kavya · SL-1 · Bride",
    ]);
  });

  it("escapes commas and quotes in CSV", () => {
    const csv = toCsv(["Name", "Note"], [["Kavya", 'said "hello", then left']]);
    expect(csv).toBe('Name,Note\r\nKavya,"said ""hello"", then left"\r\n');
  });
});
