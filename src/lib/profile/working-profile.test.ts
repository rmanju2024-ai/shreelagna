import { describe, expect, it } from "vitest";
import { mustPickWorkingProfile, workingProfileId } from "./working-profile";

describe("working profile", () => {
  it("auto-uses the only profile", () => {
    expect(workingProfileId(null, ["a"])).toBe("a");
    expect(mustPickWorkingProfile(null, ["a"])).toBe(false);
  });

  it("requires a chosen bride or groom when several exist", () => {
    expect(workingProfileId(null, ["a", "b"])).toBeNull();
    expect(workingProfileId("z", ["a", "b"])).toBeNull();
    expect(workingProfileId("b", ["a", "b"])).toBe("b");
    expect(mustPickWorkingProfile(null, ["a", "b"])).toBe(true);
    expect(mustPickWorkingProfile("a", ["a", "b"])).toBe(false);
  });
});
