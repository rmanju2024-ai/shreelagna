import { describe, expect, it } from "vitest";
import { findProfileUsingMobile, mobileKey, mobileLookupValues, sameIndiaMobile } from "./mobile-unique";

describe("mobile uniqueness", () => {
  it("normalizes 10-digit and 91-prefix numbers to the same key", () => {
    expect(mobileKey("9342877043")).toBe("9342877043");
    expect(mobileKey("919342877043")).toBe("9342877043");
    expect(mobileKey("+91 93428 77043")).toBe("9342877043");
  });

  it("treats those formats as the same mobile", () => {
    expect(sameIndiaMobile("9342877043", "919342877043")).toBe(true);
    expect(sameIndiaMobile("9342877043", "9887766554")).toBe(false);
  });

  it("looks up stored variants", () => {
    expect(mobileLookupValues("9342877043")).toEqual(expect.arrayContaining(["9342877043", "919342877043"]));
  });

  it("finds another profile holding the number", async () => {
    const db = {
      from() {
        return {
          select() {
            return {
              async in() {
                return { data: [{ id: "other", subject_mobile: "919342877043" }] };
              },
            };
          },
        };
      },
    };
    expect(await findProfileUsingMobile(db, "9342877043", "self")).toEqual({ id: "other" });
    expect(await findProfileUsingMobile(db, "9342877043", "other")).toBeNull();
  });
});
