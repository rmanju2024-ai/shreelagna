import { describe, expect, it } from "vitest";
import { digitsCode, hashOtp, makeOtpCode, otpExpired, otpMatches } from "./otp";

describe("WhatsApp OTP", () => {
  it("makes a 6-digit code", () => {
    expect(makeOtpCode()).toMatch(/^\d{6}$/);
  });

  it("hashes and matches the same mobile and code", () => {
    const hash = hashOtp("919876543210", "123456", "secret");
    expect(otpMatches("919876543210", "123456", hash, "secret")).toBe(true);
    expect(otpMatches("919876543210", "000000", hash, "secret")).toBe(false);
    expect(digitsCode("12 34 56 extra")).toBe("123456");
  });

  it("expires after the stored time", () => {
    expect(otpExpired(new Date(Date.now() - 1000), Date.now())).toBe(true);
    expect(otpExpired(new Date(Date.now() + 60_000), Date.now())).toBe(false);
  });
});
