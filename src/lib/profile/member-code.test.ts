import { describe, expect, it } from "vitest";
import { formatMemberCode, isMemberCode, allocateMemberCode } from "./member-code";

describe("member codes", () => {
  it("formats a unique house number", () => {
    expect(formatMemberCode(1)).toBe("SL000001");
    expect(formatMemberCode(10001)).toBe("SL010001");
  });

  it("rejects empty or malformed codes", () => {
    expect(isMemberCode("SL010001")).toBe(true);
    expect(isMemberCode("")).toBe(false);
    expect(isMemberCode("uuid-looking")).toBe(false);
  });

  it("allocates a house number", () => {
    expect(isMemberCode(allocateMemberCode())).toBe(true);
  });
});
