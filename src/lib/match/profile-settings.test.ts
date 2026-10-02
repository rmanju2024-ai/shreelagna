import { describe, expect, it } from "vitest";
import {
  canAlertInterest,
  canAlertProfileView,
  flagOn,
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

  it("reads pause", () => {
    expect(readProfileSettings({ status: "hidden", incognito_browse: true }).paused).toBe(true);
    expect(canAlertProfileView({ notify_profile_views: false })).toBe(false);
    expect(canAlertInterest({ notify_interest: false })).toBe(false);
    expect(flagOn(undefined, false)).toBe(false);
  });
});
