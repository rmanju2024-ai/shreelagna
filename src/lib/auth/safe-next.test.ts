import { describe, expect, it } from "vitest";
import { safeNextPath } from "./safe-next";

describe("safeNextPath", () => {
  it("keeps an in-house path", () => {
    expect(safeNextPath("/app/profiles/abc")).toBe("/app/profiles/abc");
  });

  it("rejects an external redirect", () => {
    expect(safeNextPath("//evil.example")).toBe("/app");
    expect(safeNextPath("https://evil.example")).toBe("/app");
  });
});
