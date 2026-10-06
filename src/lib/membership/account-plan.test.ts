import { describe, expect, it } from "vitest";
import { planHeaderMarks } from "./account-plan";

describe("account hub plan marks", () => {
  it("packs welcome cover with short labels", () => {
    const marks = planHeaderMarks({
      access: {
        kind: "welcome",
        live: true,
        label: "Welcome gift",
        daysLeft: 59,
        until: new Date("2026-12-02T18:30:00.000Z"),
      },
      used: 2,
      limit: 20,
    });
    expect(marks.map((item) => `${item.hint}:${item.text}`)).toEqual([
      "Name:Welcome gift",
      "Days left:59d",
      "Expiry date:3 Dec",
      "Profile counter:2/20",
    ]);
  });

  it("shows wait instead of unused waiting copy", () => {
    const marks = planHeaderMarks({
      access: { kind: "none", live: false, label: "Plan needed", daysLeft: 0, until: null },
      pendingName: "Gold",
      used: 0,
      limit: 0,
    });
    expect(marks.find((item) => item.id === "plan")?.text).toBe("No plan");
    expect(marks.find((item) => item.id === "wait")).toEqual({
      id: "wait",
      text: "Gold",
      hint: "Waiting",
      tone: "wait",
    });
  });
});
