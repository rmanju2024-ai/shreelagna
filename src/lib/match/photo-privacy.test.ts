import { describe, expect, it } from "vitest";
import { photosVisible } from "./photo-privacy";

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
});
