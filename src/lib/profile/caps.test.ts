import { describe, expect, it } from "vitest";
import {
  canAddIntro,
  canAddPhoto,
  canAddProfile,
  canWriteAbout,
  introDurationAllowed,
  resolveIntroShown,
} from "./caps";

describe("caps", () => {
  it("allows one profile per email and up to 3 photos", () => {
    expect(canAddProfile(0)).toBe(true);
    expect(canAddProfile(1)).toBe(false);
    expect(canAddPhoto(2)).toBe(true);
    expect(canAddPhoto(3)).toBe(false);
  });

  it("caps intro media at 3 minutes", () => {
    expect(introDurationAllowed(180)).toBe(true);
    expect(introDurationAllowed(181)).toBe(false);
    expect(introDurationAllowed(0)).toBe(false);
  });

  it("allows words, video, and voice together", () => {
    expect(canAddIntro("video", { video: false, audio: true, about: true })).toBe(true);
    expect(canAddIntro("audio", { video: true, audio: false, about: true })).toBe(true);
    expect(canWriteAbout({ video: true, audio: true })).toBe(true);
  });

  it("shows the last chosen intro when that content still exists", () => {
    expect(resolveIntroShown("video", true, true, true)).toBe("video");
    expect(resolveIntroShown("audio", true, true, false)).toBe("about");
    expect(resolveIntroShown(null, false, true, true)).toBe("video");
  });
});
