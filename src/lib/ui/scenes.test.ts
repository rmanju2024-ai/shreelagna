import { describe, expect, it } from "vitest";
import { parseScene, SCENE_IDS, SCENE_OPTIONS } from "./scenes";

describe("house themes", () => {
  it("offers monsoon grove and never offers midnight jewel", () => {
    expect(SCENE_IDS).toEqual(["wedding", "ivory", "dusk", "rain"]);
    expect(SCENE_OPTIONS.map((item) => item.id)).toEqual([...SCENE_IDS]);
    expect(SCENE_OPTIONS.some((item) => item.label === "Monsoon grove")).toBe(true);
    expect(SCENE_OPTIONS.some((item) => /jewel/i.test(item.label))).toBe(false);
  });

  it("falls unknown or retired jewel back to royal foil", () => {
    expect(parseScene("wedding")).toBe("wedding");
    expect(parseScene("rain")).toBe("rain");
    expect(parseScene("jewel")).toBe("wedding");
    expect(parseScene("nope")).toBe("wedding");
    expect(parseScene(null)).toBe("wedding");
  });
});
