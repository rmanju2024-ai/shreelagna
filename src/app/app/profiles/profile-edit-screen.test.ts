import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const screen = readFileSync(resolve(process.cwd(), "src/app/app/profiles/profile-edit-screen.tsx"), "utf8");

describe("amend profile tabs", () => {
  it("links each house chapter to its own edit section", () => {
    expect(screen).toContain("?edit=1&section=${tab.id}");
    for (const id of ["album", "personal", "about", "work", "family", "faith", "partner"]) {
      expect(screen).toContain(`id: "${id}"`);
    }
    expect(screen).toContain("Introduction");
    expect(screen).toContain("Education");
    expect(screen).toContain("Religion");
    expect(screen).toContain("Partner preference");
  });

  it("keeps Save and Cancel on album and form chapters", () => {
    expect(screen).toContain("BackToMyProfile");
    expect(screen).toContain("edit=1&section=album&saved=1");
    expect(screen).toContain("Cancel");
    expect(screen).toMatch(/\n\s+Save\r?\n/);
    expect(screen).toContain("section={formSection}");
  });
});
