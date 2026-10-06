import type { CSSProperties } from "react";

/** Space reserved for the site footer and the mobile tab bar. */
export function chromeBottomGap(): number {
  if (typeof window === "undefined") return 88;
  return window.matchMedia("(max-width: 820px)").matches ? 96 : 80;
}

/** Place a floating menu in the viewport, above footer/nav, flipping upward when needed. */
export function placeFloat(
  trigger: HTMLElement,
  opts?: { minWidth?: number; maxHeightCap?: number; preferUp?: boolean },
): CSSProperties {
  const box = trigger.getBoundingClientRect();
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const gap = chromeBottomGap();
  const minWidth = opts?.minWidth ?? 13 * 16;
  const cap = opts?.maxHeightCap ?? 22 * 16;
  const width = Math.min(Math.max(box.width, minWidth), vw - 16);
  const left = Math.min(Math.max(8, box.left), vw - width - 8);
  const below = vh - box.bottom - gap;
  const above = box.top - 12;
  const openUp = opts?.preferUp ? above >= below : below < 220 && above > below;
  const maxHeight = Math.min(cap, Math.max(10 * 16, openUp ? above : below));
  return {
    position: "fixed",
    zIndex: 700,
    left,
    width,
    maxHeight,
    top: openUp ? undefined : box.bottom + 6,
    bottom: openUp ? vh - box.top + 6 : undefined,
  };
}

/** Compact More menu, aligned to the More chip (top overlay or bottom bar). */
export function placeMoreMenu(trigger: HTMLElement): CSSProperties {
  const box = trigger.getBoundingClientRect();
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const width = Math.min(13.25 * 16, vw - 16);
  const left = Math.min(Math.max(8, box.right - width), vw - width - 8);
  const openDown = box.top < vh * 0.55;
  const room = openDown ? vh - box.bottom - 12 : box.top - 12;
  return {
    position: "fixed",
    zIndex: 1100,
    left,
    width,
    maxHeight: Math.min(14.5 * 16, Math.max(8 * 16, room)),
    top: openDown ? box.bottom + 8 : undefined,
    bottom: openDown ? undefined : vh - box.top + 8,
  };
}
