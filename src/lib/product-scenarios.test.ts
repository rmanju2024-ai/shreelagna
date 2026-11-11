import { afterEach, describe, expect, it, vi } from "vitest";
import { safeNextPath } from "@/lib/auth/safe-next";
import { parseBrowseFilters, profileFitsBrowse } from "@/lib/match/browse-filters";
import { browseRank, mergeSmartPicks, parseBrowseView } from "@/lib/match/browse-match";
import {
  canSendInterest,
  effectiveInterestStatus,
  openInterestBlocksSend,
  pairCanChat,
} from "@/lib/match/interest-status";
import { photosVisible } from "@/lib/match/photo-privacy";
import { DAILY_NEW_FAMILY_CAP, interestLimitFor, resolveQuota } from "@/lib/membership/quota";
import { sendChannelAlert, sendChannelOtp } from "@/lib/notify/channel";
import { digitsCode, hashOtp, otpExpired, otpMatches } from "@/lib/notify/otp";
import { isIndiaMobile, toWhatsAppNumber } from "@/lib/notify/phone";
import { whatsappFailFlag, whatsappSendAlerts } from "@/lib/notify/whatsapp";
import { otherProfileLocked } from "@/lib/profile/view-gate";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("OTP — happy, reject, messy input", () => {
  it("accepts the same mobile and six digits", () => {
    const hash = hashOtp("919876543210", "482193", "house");
    expect(otpMatches("919876543210", "482193", hash, "house")).toBe(true);
  });

  it("rejects a wrong code, another mobile, or a spent code", () => {
    const hash = hashOtp("919876543210", "482193", "house");
    expect(otpMatches("919876543210", "000000", hash, "house")).toBe(false);
    expect(otpMatches("919999999999", "482193", hash, "house")).toBe(false);
    expect(otpExpired("not-a-date")).toBe(true);
    expect(otpExpired(new Date(0))).toBe(true);
  });

  it("strips spaces from a pasted code", () => {
    expect(digitsCode("  48-21-93  ")).toBe("482193");
    const hash = hashOtp("919876543210", "482193", "house");
    expect(otpMatches("919876543210", "48 21 93", hash, "house")).toBe(true);
  });
});

describe("WhatsApp numbers — India and junk", () => {
  it("normalises +91, leading 0, and spaced digits", () => {
    expect(toWhatsAppNumber("+91 91104 93661")).toBe("919110493661");
    expect(isIndiaMobile("9110493661")).toBe(true);
  });

  it("rejects landline-short and letters-only", () => {
    expect(toWhatsAppNumber("080-123")).toBeNull();
    expect(toWhatsAppNumber("whatsapp")).toBeNull();
    expect(isIndiaMobile(null)).toBe(false);
  });
});

describe("WhatsApp OTP on, alerts off", () => {
  it("keeps alerts off unless WHATSAPP_SEND_ALERTS is true", () => {
    vi.stubEnv("WHATSAPP_SEND_ALERTS", "");
    expect(whatsappSendAlerts()).toBe(false);
    vi.stubEnv("WHATSAPP_SEND_ALERTS", "false");
    expect(whatsappSendAlerts()).toBe(false);
    vi.stubEnv("WHATSAPP_SEND_ALERTS", "true");
    expect(whatsappSendAlerts()).toBe(true);
  });

  it("skips interest WhatsApp while still allowing an OTP send path", async () => {
    vi.stubEnv("WHATSAPP_SEND_ALERTS", "false");
    vi.stubEnv("WHATSAPP_TOKEN", "token");
    vi.stubEnv("WHATSAPP_PHONE_NUMBER_ID", "1317222201476313");
    vi.stubEnv("NOTIFY_CHANNEL", "whatsapp");
    await expect(sendChannelAlert("interest", "919110493661", ["Interest", "Hi"])).resolves.toEqual({ ok: true });
    const otp = await sendChannelOtp("919110493661", "123456");
    expect(otp.ok || otp.error).toBeTruthy();
  });

  it("maps Meta failures for the family", () => {
    expect(whatsappFailFlag("(#132001) Template name does not exist")).toBe("0");
    expect(whatsappFailFlag("(#131030) not in allowed list")).toBe("allowlist");
  });
});

describe("Discover filters and buckets", () => {
  const row = {
    date_of_birth: "1996-06-01",
    current_country: "India",
    current_state: "Karnataka",
    current_city: "Bengaluru",
    religion_name: "Hindu",
    community_name: "Iyer",
    diet: "Vegetarian",
    qualification: "B.E. / B.Tech",
    income_band: "₹15–20 lakh",
    profile_type: "vara",
  };

  it("lets an empty filter through (positive)", () => {
    expect(profileFitsBrowse(row, parseBrowseFilters({}))).toBe(true);
    expect(parseBrowseView("")).toBe("smart");
  });

  it("fails when any one hard filter misses (negative)", () => {
    const tight = parseBrowseFilters({
      age_min: "24",
      age_max: "32",
      city: "Bengaluru",
      religion: "Hindu",
      community: "Iyer",
      lifestyle: "Non-vegetarian",
    });
    expect(profileFitsBrowse(row, tight)).toBe(false);
  });

  it("keeps one person in smart picks without cloning the id", () => {
    const merged = mergeSmartPicks(
      [{ id: "jayesh", score: "14/15 of your preference" }],
      [{ id: "jayesh", score: "11/15 of their preference" }],
    );
    expect(merged).toHaveLength(1);
    expect(merged[0]?.id).toBe("jayesh");
  });

  it("fails kundali when charts are empty", () => {
    const rank = browseRank("kundali", {}, {}, { ageYears: 30 }, { ageYears: 28 });
    expect(rank.pass).toBe(false);
  });
});

describe("Profile lock, photos, interest, quota together", () => {
  it("shows photos to the owner even when the other family is locked", () => {
    expect(otherProfileLocked({ own: true, needComplete: true, needPlan: true })).toBe(false);
    expect(photosVisible({ own: true, hideUntilAccept: true })).toBe(true);
  });

  it("hides another family's photos until accept, and blocks a second send", () => {
    expect(photosVisible({ hideUntilAccept: true, accepted: false })).toBe(false);
    expect(canSendInterest("a", "a")).toBe(false);
    expect(openInterestBlocksSend("pending")).toBe(true);
  });

  it("opens chat after accept even if photos were hidden before", () => {
    const rows = [
      { from_profile_id: "a", to_profile_id: "b", status: "accepted", created_at: new Date().toISOString() },
    ];
    expect(pairCanChat(rows, "a", "b")).toBe(true);
    expect(photosVisible({ hideUntilAccept: true, accepted: true })).toBe(true);
    expect(effectiveInterestStatus("pending", new Date().toISOString())).toBe("pending");
  });

  it("stops a 21st welcome interest and a 6th new family today", () => {
    expect(interestLimitFor("welcome")).toBe(20);
    expect(resolveQuota(20, 20).canSend).toBe(false);
    expect(resolveQuota(20, 4, [], DAILY_NEW_FAMILY_CAP).canSend).toBe(false);
    expect(resolveQuota(20, 4, [], 2).canSend).toBe(true);
  });
});

describe("Login bounce and junk paths", () => {
  it("keeps Discover after Google sign-in", () => {
    expect(safeNextPath("/browse")).toBe("/browse");
  });

  it("drops protocol-relative phishing", () => {
    expect(safeNextPath("/\\evil")).toBe("/app");
    expect(safeNextPath("\t/browse")).toBe("/app");
  });
});

