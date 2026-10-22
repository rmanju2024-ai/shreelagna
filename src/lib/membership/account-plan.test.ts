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
      "Plan:Welcome gift",
      "Days left:59d",
      "Expiry date:3 Dec",
      "Profiles used:2 of 20",
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

  it("names house cover Staff or Admin and shows profiles used", () => {
    expect(
      planHeaderMarks({
        access: { kind: "house", live: true, label: "Staff house access", daysLeft: 0, until: null },
        used: 14,
        limit: null,
      }).map((item) => `${item.hint}:${item.text}`),
    ).toEqual(["Plan:Staff", "Profiles used:14"]);
    expect(
      planHeaderMarks({
        access: { kind: "house", live: true, label: "Admin house access", daysLeft: 0, until: null },
        used: 3,
        limit: null,
      }).find((item) => item.id === "plan")?.text,
    ).toBe("Admin");
  });
});
