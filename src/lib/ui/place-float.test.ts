// @vitest-environment jsdom

import { describe, expect, it } from "vitest";
import { placeMoreMenu } from "./place-float";

function trigger(box: { top: number; right: number; bottom: number; left: number; width: number; height: number }) {
  return {
    getBoundingClientRect: () => box,
  } as HTMLElement;
}

describe("placeMoreMenu", () => {
  it("opens under a top More chip and lines up with its right edge", () => {
    Object.defineProperty(window, "innerWidth", { configurable: true, value: 390 });
    Object.defineProperty(window, "innerHeight", { configurable: true, value: 800 });
    const style = placeMoreMenu(
      trigger({ top: 12, right: 382, bottom: 64, left: 302, width: 80, height: 52 }),
    );
    expect(style.position).toBe("fixed");
    expect(style.top).toBe(72);
    expect(style.bottom).toBe("auto");
    expect(Number(style.left) + Number(style.width)).toBeLessThanOrEqual(390 - 8);
  });

  it("opens above a bottom More chip", () => {
    const vh = window.innerHeight || 800;
    Object.defineProperty(window, "innerHeight", { configurable: true, value: 800 });
    Object.defineProperty(window, "innerWidth", { configurable: true, value: 390 });
    const style = placeMoreMenu(
      trigger({ top: 730, right: 380, bottom: 788, left: 300, width: 80, height: 58 }),
    );
    expect(style.top).toBe("auto");
    expect(style.bottom).toBe(800 - 730 + 8);
    void vh;
  });
});
