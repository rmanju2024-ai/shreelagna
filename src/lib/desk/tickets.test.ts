import { describe, expect, it } from "vitest";
import {
  isOpenTicket,
  notesByTicket,
  parseTicketStatus,
  readNoteBody,
  readNoteStatus,
  stampNoteBody,
  memberRequestStatus,
  requestOutcomeLines,
  ticketEnquiryLabel,
  ticketStatusClass,
  ticketStatusLabel,
  trimTicketResolution,
} from "./tickets";

describe("desk tickets", () => {
  it("accepts only house ticket statuses", () => {
    expect(parseTicketStatus("new")).toBe("new");
    expect(parseTicketStatus("in_progress")).toBe("in_progress");
    expect(parseTicketStatus("on_hold")).toBe("on_hold");
    expect(parseTicketStatus("done")).toBe("done");
    expect(parseTicketStatus("closed")).toBeNull();
  });

  it("labels status and enquiry for staff", () => {
    expect(ticketStatusLabel("in_progress")).toBe("In progress");
    expect(ticketStatusLabel("on_hold")).toBe("On hold");
    expect(ticketStatusClass("done")).toBe("is-done");
    expect(ticketStatusClass("new")).toBe("is-new");
    expect(ticketEnquiryLabel("vadhu")).toBe("Bride profile");
    expect(ticketEnquiryLabel("vara")).toBe("Groom profile");
    expect(isOpenTicket("on_hold")).toBe(true);
    expect(isOpenTicket("done")).toBe(false);
    expect(trimTicketResolution("  called family  ")).toBe("called family");
    expect(trimTicketResolution("   ")).toBeNull();
    expect(
      notesByTicket([
        { id: "1", ticket_id: "a", body: "called", created_at: "2026-09-25T08:00:00Z" },
        { id: "2", ticket_id: "b", body: "hold", created_at: "2026-09-25T09:00:00Z" },
        { id: "3", ticket_id: "a", body: "done", created_at: "2026-09-25T10:00:00Z" },
      ]).get("a")?.map((row) => row.body),
    ).toEqual(["called", "done"]);
  });

  it("keeps ticket status on each note body", () => {
    const stored = stampNoteBody("called family", "done");
    expect(stored.startsWith("[[status:done]]")).toBe(true);
    expect(readNoteBody(stored)).toBe("called family");
    expect(readNoteStatus({ body: stored })).toBe("done");
    expect(readNoteStatus({ body: stored, ticket_status: "on_hold" })).toBe("on_hold");
  });

  it("explains request progress to the family without desk wording", () => {
    expect(memberRequestStatus("new").label).toBe("Received");
    expect(memberRequestStatus("in_progress").label).toBe("In review");
    expect(memberRequestStatus("on_hold").label).toBe("Paused");
    expect(memberRequestStatus("done")).toEqual({
      label: "Resolved",
      hint: "This request is closed.",
    });
  });

  it("splits a desk outcome into readable lines", () => {
    expect(
      requestOutcomeLines("Called family 25 Sep 2026 · 2:09 pm IST — Photo approved 25 Sep 2026 · 2:10 pm IST — solved"),
    ).toEqual([
      "Called family 25 Sep 2026 · 2:09 pm IST",
      "Photo approved 25 Sep 2026 · 2:10 pm IST",
      "solved",
    ]);
  });
});
