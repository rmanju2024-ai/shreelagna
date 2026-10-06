import { describe, expect, it } from "vitest";
import { safetyCategoryLabel, safetyPartyLabel, safetyStatusLabel } from "./safety-cases";

describe("safety case copy", () => {
  it("names the report reason in plain English", () => {
    expect(safetyCategoryLabel("fake_profile")).toBe("Fake profile");
    expect(safetyCategoryLabel("money_request")).toBe("Asked for money");
  });

  it("names who reported and who was reported", () => {
    expect(
      safetyPartyLabel({
        id: "p1",
        name: "Bhavya R",
        code: "SL010004",
        kind: "Bride",
      }),
    ).toBe("Bhavya R · SL010004 · Bride");
    expect(safetyPartyLabel(undefined, "cf2089f8-067a-430f-a5c0-9d9af2c1b992")).toMatch(/Unknown member \(cf2089f8\)/);
  });

  it("labels case status for staff", () => {
    expect(safetyStatusLabel("new")).toBe("New");
    expect(safetyStatusLabel("in_review")).toBe("In review");
  });
});
