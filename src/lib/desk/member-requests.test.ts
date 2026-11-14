import { describe, expect, it } from "vitest";
import { loadMemberSupportRequests } from "./member-requests";

describe("member support requests", () => {
  it("loads the member’s own requests newest first", async () => {
    const rows = [
      { id: "2", created_at: "2026-11-14", enquiry_type: "general", message: "Photo stuck", status: "done", resolution: "Approved" },
    ];
    const db = {
      from: () => ({
        select: () => ({
          eq: () => ({
            order: async () => ({ data: rows, error: null }),
          }),
          ilike: () => ({
            order: async () => ({ data: [], error: null }),
          }),
        }),
      }),
    };
    await expect(loadMemberSupportRequests(db, { id: "me", email: "a@b.com" })).resolves.toEqual(rows);
  });

  it("falls back to matching Gmail when ownership is missing", async () => {
    const byMail = [{ id: "old", created_at: "2026-10-01", enquiry_type: "general", message: "Need help", status: "new", resolution: null }];
    const db = {
      from: () => ({
        select: () => ({
          eq: () => ({
            order: async () => ({ data: [], error: { message: "column" } }),
          }),
          ilike: () => ({
            order: async () => ({ data: byMail, error: null }),
          }),
        }),
      }),
    };
    await expect(loadMemberSupportRequests(db, { id: "me", email: "a@b.com" })).resolves.toEqual(byMail);
  });
});
