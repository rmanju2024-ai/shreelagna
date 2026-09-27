import { describe, expect, it } from "vitest";
import { googleAuthHelp } from "./google-errors";

describe("googleAuthHelp", () => {
  it("keeps HTTP 400 help visitor-safe", () => {
    const msg = googleAuthHelp("unsupported_provider", 400);
    expect(msg.toLowerCase()).toContain("google");
    expect(msg.toLowerCase()).not.toContain("supabase");
    expect(msg.toLowerCase()).not.toContain(".env");
  });

  it("does not leak internals for other errors", () => {
    const msg = googleAuthHelp("network down");
    expect(msg.toLowerCase()).not.toContain("supabase");
    expect(msg).toMatch(/try again/i);
  });
});
