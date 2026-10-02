import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const form = readFileSync(resolve(process.cwd(), "src/app/app/profiles/profile-form.tsx"), "utf8");
const css = readFileSync(resolve(process.cwd(), "src/app/theme-genz.css"), "utf8");

describe("guided profile creation contract", () => {
  it("contains all five guided stages", () => {
    for (const stage of ["Basics", "Life today", "Faith", "Your story", "Preferences"]) {
      expect(form).toContain(`title: "${stage}"`);
    }
    expect(form).toContain("Step {wizardStep} of {WIZARD_STEPS.length}");
  });

  it("keeps every field mounted and only changes panel visibility", () => {
    expect(form).toContain("wizard-panel");
    expect(css).toContain(".is-wizard .wizard-panel { display: none; }");
    expect(css).toContain(".is-wizard .wizard-panel.is-current { display: block;");
  });

  it("moves the user to the first missing required field before save", () => {
    expect(form).toContain('querySelector<HTMLElement>(":invalid")');
    expect(form).toContain("setWizardStep(targetStep)");
    expect(form).toContain("reportValidity");
  });

  it("explains draft restrictions and recovery", () => {
    expect(form).toContain('name="save_intent" value="draft"');
    expect(form).toContain("cannot send interests, chat, or reveal contact details");
    expect(form).toContain("Missing fields will be shown clearly");
    expect(form).toContain("return and improve every section later");
  });

  it("uses a horizontally scrollable stepper on phones", () => {
    expect(css).toContain(".profile-wizard-steps");
    expect(css).toContain("scroll-snap-type: x mandatory");
    expect(css).toContain("env(safe-area-inset-bottom)");
  });
});
