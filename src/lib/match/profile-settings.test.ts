import { describe, expect, it } from "vitest";
import {
  canAlertInterest,
  canAlertProfileView,
  contactMayRelease,
  flagOn,
  parseContactReleaseMode,
  readProfileSettings,
} from "./profile-settings";

describe("profile settings", () => {
  it("defaults privacy and alerts", () => {
    const settings = readProfileSettings({ status: "active" }, {});
    expect(settings.hideLastSeen).toBe(false);
    expect(settings.hidePhotoUntilAccept).toBe(true);
    expect(settings.notifyProfileViews).toBe(true);
    expect(settings.notifyInterest).toBe(true);
    expect(settings.notifyMatchEmail).toBe(true);
    expect(settings.notifyWhatsapp).toBe(true);
    expect(settings.paused).toBe(false);
  });

  it("keeps two profiles' settings independent", () => {
    const bride = readProfileSettings({
      hide_last_seen: true,
      notify_interest: false,
      hide_photo_until_accept: false,
      status: "active",
    });
    const groom = readProfileSettings({
      hide_last_seen: false,
      notify_interest: true,
      hide_photo_until_accept: true,
      status: "hidden",
    });
    expect(bride.hideLastSeen).toBe(true);
    expect(groom.hideLastSeen).toBe(false);
    expect(bride.notifyInterest).toBe(false);
    expect(groom.notifyInterest).toBe(true);
    expect(bride.paused).toBe(false);
    expect(groom.paused).toBe(true);
  });

  it("reads pause", () => {
    expect(readProfileSettings({ status: "hidden", incognito_browse: true }).paused).toBe(true);
    expect(canAlertProfileView({ notify_profile_views: false })).toBe(false);
    expect(canAlertInterest({ notify_interest: false })).toBe(false);
    expect(flagOn(undefined, false)).toBe(false);
  });

  it("releases contact after send, after accept, or never", () => {
    expect(parseContactReleaseMode(undefined)).toBe("sent_interest");
    expect(contactMayRelease("sent_interest", { sentByMe: true })).toBe(true);
    expect(contactMayRelease("sent_interest", { sentByMe: false, accepted: false })).toBe(false);
    expect(contactMayRelease("accepted_interest", { sentByMe: true, accepted: false })).toBe(false);
    expect(contactMayRelease("accepted_interest", { accepted: true })).toBe(true);
    expect(contactMayRelease("never", { sentByMe: true, accepted: true })).toBe(false);
    expect(readProfileSettings({}).contactReleaseMode).toBe("sent_interest");
  });
});
