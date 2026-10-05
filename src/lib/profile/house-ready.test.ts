import { describe, expect, it } from "vitest";
import { viewerEmailVerified } from "./house-ready";

describe("viewerEmailVerified", () => {
  it("accepts a verified timestamp or a signed-in email", () => {
    expect(viewerEmailVerified({ email_otp_verified_at: "2026-01-01" })).toBe(true);
    expect(viewerEmailVerified({ email: "a@gmail.com" })).toBe(true);
  });

  it("rejects an empty account", () => {
    expect(viewerEmailVerified({})).toBe(false);
    expect(viewerEmailVerified({ email: "", email_otp_verified_at: null })).toBe(false);
  });
});
