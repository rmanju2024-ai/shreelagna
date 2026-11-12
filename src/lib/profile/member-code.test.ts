import { describe, expect, it } from "vitest";
import {
  allocateMemberCode,
  formatMemberCode,
  genderCode,
  isMemberCode,
  regionCode,
} from "./member-code";

describe("member codes", () => {
  it("builds ISO region + gender + serial", () => {
    expect(formatMemberCode(1, { region: "KA", gender: "F" })).toBe("MC-KA-F-00000001");
    expect(formatMemberCode(10001, { region: "TN", gender: "M" })).toBe("MC-TN-M-00010001");
    expect(formatMemberCode(10_00_000, { region: "KA", gender: "F" })).toBe("MC-KA-F-01000000");
    expect(formatMemberCode(1)).toBe("SL000001");
  });

  it("maps Indian states and profile type with ISO codes", () => {
    expect(regionCode({ nativeState: "Karnataka" })).toBe("KA");
    expect(regionCode({ nativeCountry: "United Arab Emirates" })).toBe("AE");
    expect(regionCode({})).toBe("XX");
    expect(genderCode("vadhu")).toBe("F");
    expect(genderCode("vara")).toBe("M");
  });

  it("accepts new and legacy house numbers", () => {
    expect(isMemberCode("MC-KA-F-00000001")).toBe(true);
    expect(isMemberCode("MC-KA-F-010001")).toBe(true);
    expect(isMemberCode("SL010001")).toBe(true);
    expect(isMemberCode("")).toBe(false);
    expect(isMemberCode("uuid-looking")).toBe(false);
  });

  it("allocates a coded house number", () => {
    const code = allocateMemberCode({ profileType: "vara", nativeState: "Kerala" });
    expect(code.startsWith("MC-KL-M-")).toBe(true);
    expect(isMemberCode(code)).toBe(true);
  });
});
