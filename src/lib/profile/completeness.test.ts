import { describe, expect, it } from "vitest";
import {
  canInitiateConnect,
  canReplyOnInboundThread,
  completenessGaps,
  completenessScore,
  daysInMonth,
  defaultDobIso,
  ageFromDob,
  formatBirthTime,
  formatBirthWithAge,
  isAdult,
  isMandatoryReadyFromRecord,
  isProfileComplete,
  maxDobIso,
  nextReviewStatus,
  smsOtpRequiredFromEnv,
} from "./completeness";

const complete = {
  subjectFullName: "Meera Iyer",
  surname: "Iyer",
  dateOfBirth: "1998-01-15",
  currentCity: "Bengaluru",
  heightCm: 162,
  maritalStatus: "never_married",
  qualification: "B.E.",
  occupation: "Engineer",
  about: "A".repeat(80),
  communityId: "c1",
  preferNotCommunity: false,
  hasApprovedPhoto: true,
  emailOtpVerified: true,
  subjectMobile: "9876543210",
  phoneOtpVerified: true,
  smsOtpRequired: true,
  birthTime: "06:30",
  birthCity: "Bengaluru",
};

describe("completeness", () => {
  it("sends a complete draft to house review", () => {
    expect(nextReviewStatus("draft", true)).toBe("pending_review");
    expect(nextReviewStatus("active", true)).toBe("active");
    expect(nextReviewStatus("on_hold", true)).toBe("on_hold");
    expect(nextReviewStatus("draft", false)).toBe("draft");
    expect(nextReviewStatus("pending_review", false)).toBe("draft");
    expect(nextReviewStatus("active", true, { contentChanged: true })).toBe("pending_review");
    expect(nextReviewStatus("active", true, { contentChanged: false })).toBe("active");
  });

  it("requires 21+", () => {
    expect(isAdult("2010-01-01", new Date("2026-09-22"))).toBe(false);
    expect(isAdult("2000-01-01", new Date("2026-09-22"))).toBe(true);
  });

  it("offers an easy adult default birth date", () => {
    const today = new Date("2026-09-22");
    expect(defaultDobIso(today)).toBe("1999-06-15");
    expect(isAdult(defaultDobIso(today), today)).toBe(true);
    expect(maxDobIso(today)).toBe("2005-09-22");
    expect(daysInMonth(2024, 1)).toBe(29);
  });

  it("prints time of birth in 12-hour form", () => {
    expect(formatBirthTime("06:30")).toBe("6:30 AM");
    expect(formatBirthTime("18:05:00")).toBe("6:05 PM");
    expect(formatBirthTime("00:00")).toBe("12:00 AM");
    expect(formatBirthTime("12:00")).toBe("12:00 PM");
    expect(formatBirthTime("6:30 am")).toBe("6:30 AM");
    expect(formatBirthTime("")).toBeNull();
  });

  it("prints birth date with age in brackets", () => {
    expect(formatBirthWithAge("1995-06-15", new Date("2026-09-23"))).toBe(
      "15 June 1995 (31 years, 3 months, 8 days)",
    );
  });

  it("is complete when required fields, photo, and both OTPs are present", () => {
    expect(isProfileComplete(complete)).toBe(true);
  });

  it("treats formatted about text by visible length", () => {
    expect(isProfileComplete({ ...complete, about: `<b>${"A".repeat(80)}</b>` })).toBe(true);
    expect(isProfileComplete({ ...complete, about: `<b>${"A".repeat(40)}</b>` })).toBe(false);
  });

  it("is complete with About, video, voice, or any mix", () => {
    expect(isProfileComplete({ ...complete, about: "", hasVideo: true })).toBe(true);
    expect(isProfileComplete({ ...complete, about: "", hasAudio: true })).toBe(true);
    expect(isProfileComplete({ ...complete, hasVideo: true })).toBe(true);
    expect(isProfileComplete({ ...complete, about: "" })).toBe(false);
  });

  it("stays incomplete without an approved photo", () => {
    expect(isProfileComplete({ ...complete, hasApprovedPhoto: false })).toBe(
      false,
    );
  });

  it("does not require SMS OTP in development", () => {
    expect(
      isProfileComplete({
        ...complete,
        phoneOtpVerified: false,
        smsOtpRequired: false,
      }),
    ).toBe(true);
  });

  it("requires SMS OTP in production", () => {
    expect(
      isProfileComplete({
        ...complete,
        phoneOtpVerified: false,
        smsOtpRequired: true,
      }),
    ).toBe(false);
  });

  it("blocks outbound connect when incomplete", () => {
    expect(canInitiateConnect({ isComplete: false, status: "active" })).toBe(
      false,
    );
    expect(canInitiateConnect({ isComplete: true, status: "active" })).toBe(
      true,
    );
  });

  it("does not treat a stale complete flag as live must-have readiness", () => {
    expect(
      isMandatoryReadyFromRecord(
        {
          subject_full_name: "Manju",
          surname: "Iyer",
          date_of_birth: "1995-01-01",
          current_city: "Chennai",
          height_cm: 165,
          marital_status: "never_married",
          qualification: "Graduate",
          occupation: "Software professional",
          about: "A".repeat(80),
          subject_mobile: "9876543210",
          is_complete: true,
        },
        { hasApprovedPhoto: true, emailOtpVerified: true },
      ),
    ).toBe(false);
  });

  it("allows inbound replies when incomplete", () => {
    expect(
      canReplyOnInboundThread({ isComplete: false, isInboundThread: true }),
    ).toBe(true);
    expect(
      canReplyOnInboundThread({ isComplete: false, isInboundThread: false }),
    ).toBe(false);
  });

  it("lists remaining completeness steps", () => {
    const gaps = completenessGaps({
      ...complete,
      hasApprovedPhoto: false,
      about: "short",
    });
    expect(gaps.map((g) => g.key)).toContain("intro");
    expect(gaps.map((g) => g.key)).toContain("photo");
  });

  it("scores mandatory complete even when recommended fields are empty", () => {
    const score = completenessScore(complete);
    expect(score.mandatoryPct).toBe(100);
    expect(score.overallPct).toBeLessThan(100);
    expect(score.pendingMandatory).toHaveLength(0);
    expect(score.pendingRecommended.map((item) => item.key)).toContain("income");
  });

  it("treats SMS as optional unless env is true", () => {
    expect(smsOtpRequiredFromEnv("false")).toBe(false);
    expect(smsOtpRequiredFromEnv("true")).toBe(true);
    expect(smsOtpRequiredFromEnv(undefined)).toBe(false);
  });
});
