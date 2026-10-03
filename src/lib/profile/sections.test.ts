import { describe, expect, it } from "vitest";
import {
  GAP_TO_SECTION,
  isProfileEditSection,
  isProfileEditTarget,
  pickSectionRecord,
  portraitTabForSection,
} from "./sections";

describe("profile edit section guards", () => {
  it.each(["", "admin", "profile_id", "../about", "ABOUT"])("rejects an unsafe or unknown section: %s", (value) => {
    expect(isProfileEditSection(value)).toBe(false);
    expect(isProfileEditTarget(value)).toBe(false);
    expect(portraitTabForSection(value)).toBeUndefined();
  });

  it("only retains whitelisted fields from a section save", () => {
    expect(pickSectionRecord({ about: "Hello", role: "admin", created_by: "other" }, ["about"])).toEqual({
      about: "Hello",
    });
  });

  it("maps all known readiness gaps to an editable section", () => {
    for (const section of Object.values(GAP_TO_SECTION)) {
      expect(isProfileEditTarget(section)).toBe(true);
    }
  });
});
