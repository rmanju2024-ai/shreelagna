import { describe, expect, it } from "vitest";
import { deskItemsFor } from "@/app/desk/desk-nav";
import { canEditMemberProfile, isAdminRole, isStaffRole } from "./access";
import { loadSafetyParties, safetyCategoryLabel, safetyStatusLabel } from "./safety-cases";
import {
  isOpenTicket,
  parseTicketStatus,
  readNoteBody,
  stampNoteBody,
  ticketEnquiryLabel,
} from "./tickets";

describe("staff vs admin desk", () => {
  it("lets staff onto every desk except Verification", () => {
    const staff = deskItemsFor(false).map((item) => item.id);
    expect(staff).toContain("tickets");
    expect(staff).toContain("safety");
    expect(staff).toContain("look");
    expect(staff).toContain("plans");
    expect(staff).not.toContain("verification");
    expect(isStaffRole("service")).toBe(true);
    expect(isAdminRole("service")).toBe(false);
  });

  it("adds Verification for admin", () => {
    const admin = deskItemsFor(true).map((item) => item.id);
    expect(admin).toContain("verification");
    expect(admin).toContain("staff");
    expect(isAdminRole("admin")).toBe(true);
  });

  it("blocks members from the desk role check", () => {
    expect(isStaffRole("member")).toBe(false);
    expect(isStaffRole(null)).toBe(false);
  });
});

describe("who may amend a profile from the desk", () => {
  it("lets the owner and admin always edit", () => {
    expect(canEditMemberProfile({ id: "me", role: "member" }, { id: "me", role: "member" })).toBe(true);
    expect(canEditMemberProfile({ id: "boss", role: "admin" }, { id: "them", role: "member" })).toBe(true);
  });

  it("lets staff edit members but not an admin’s own profile", () => {
    expect(canEditMemberProfile({ id: "desk", role: "service" }, { id: "them", role: "member" })).toBe(true);
    expect(canEditMemberProfile({ id: "desk", role: "service" }, { id: "boss", role: "admin" })).toBe(false);
    expect(canEditMemberProfile({ id: "desk", role: "service" }, null)).toBe(false);
  });
});

describe("ticket queue — happy, junk, mixed notes", () => {
  it("opens a new bride enquiry and stamps a status note", () => {
    expect(ticketEnquiryLabel("vadhu")).toBe("Bride profile");
    expect(isOpenTicket("new")).toBe(true);
    expect(stampNoteBody("called father", "in_progress")).toMatch(/^\[\[status:in_progress\]\] called father$/);
    expect(readNoteBody("[[status:done]] paid")).toBe("paid");
  });

  it("rejects unknown ticket states and empty notes", () => {
    expect(parseTicketStatus("CLOSED")).toBeNull();
    expect(parseTicketStatus("")).toBeNull();
    expect(ticketEnquiryLabel("other")).toBe("General help");
  });
});

describe("safety queue — labels and empty load", () => {
  it("maps known and unknown categories", () => {
    expect(safetyCategoryLabel("harassment")).toBe("Harassment or threats");
    expect(safetyCategoryLabel("odd_reason")).toBe("odd reason");
    expect(safetyStatusLabel("dismissed")).toBe("Dismissed");
    expect(safetyStatusLabel(undefined)).toBe("New");
  });

  it("returns no parties when the queue has no ids", async () => {
    const map = await loadSafetyParties(
      {
        from: () => ({
          select: () => ({
            in: async () => ({ data: [] }),
          }),
        }),
      },
      [],
    );
    expect(map.size).toBe(0);
  });
});
