import { describe, expect, it } from "vitest";
import { otherProfileLocked } from "./view-gate";

describe("other profile view gate", () => {
  it("never locks the owner's own profile", () => {
    expect(otherProfileLocked({ own: true, needComplete: true, needPlan: true })).toBe(false);
  });

  it("locks another family when must-haves are open", () => {
    expect(otherProfileLocked({ own: false, needComplete: true, needPlan: false })).toBe(true);
  });

  it("locks another family when there is no live plan", () => {
    expect(otherProfileLocked({ own: false, needComplete: false, needPlan: true })).toBe(true);
  });

  it("opens details when biodata and plan are ready", () => {
    expect(otherProfileLocked({ own: false, needComplete: false, needPlan: false })).toBe(false);
  });
});
