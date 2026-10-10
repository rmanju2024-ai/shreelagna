import { describe, expect, it } from "vitest";
import { buildPushPayload, defaultAlertUrl, isGonePushStatus, shouldDeliverHouseChannels } from "./push-payload";

describe("web push payload", () => {
  it("opens alerts by default and keeps a same-origin deep link", () => {
    expect(defaultAlertUrl(null)).toBe("/app/alerts");
    expect(defaultAlertUrl("https://evil.example/x")).toBe("/app/alerts");
    expect(buildPushPayload({ title: "Rohan", body: "Rohan viewed your profile.", href: "/browse/abc", kind: "profile_view" })).toEqual({
      title: "Rohan",
      body: "Rohan viewed your profile.",
      url: "/browse/abc",
      kind: "profile_view",
    });
  });

  it("drops gone endpoints and skips family chat", () => {
    expect(isGonePushStatus(410)).toBe(true);
    expect(isGonePushStatus(404)).toBe(true);
    expect(isGonePushStatus(201)).toBe(false);
    expect(shouldDeliverHouseChannels("chat")).toBe(false);
    expect(shouldDeliverHouseChannels("shortlist")).toBe(true);
  });
});
