import { describe, expect, it } from "vitest";
import { detailsVisible, photosVisible } from "./photo-privacy";

describe("photo privacy", () => {
  it("hides photos until interest is accepted by default", () => {
    expect(photosVisible({})).toBe(false);
    expect(photosVisible({ hideUntilAccept: true })).toBe(false);
    expect(photosVisible({ accepted: true })).toBe(true);
    expect(photosVisible({ own: true })).toBe(true);
    expect(photosVisible({ staff: true })).toBe(true);
    expect(photosVisible({ hideUntilAccept: false })).toBe(true);
    expect(photosVisible({ hideUntilAccept: true, interestReceived: true })).toBe(true);
  });

  it("keeps locked details hidden until accept, even if interest is only pending", () => {
    expect(detailsVisible({ hideUntilAccept: true })).toBe(false);
    expect(detailsVisible({ hideUntilAccept: true, accepted: true })).toBe(true);
    expect(detailsVisible({ own: true, hideUntilAccept: true })).toBe(true);
    expect(detailsVisible({ hideUntilAccept: false })).toBe(true);
  });
});
