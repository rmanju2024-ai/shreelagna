import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const css = readFileSync(resolve(process.cwd(), "src/app/theme-genz.css"), "utf8");

describe("shared mobile CSS contract", () => {
  it("uses the project phone breakpoint and safe-area bottom navigation", () => {
    expect(css).toContain("@media (max-width: 820px)");
    expect(css).toContain("env(safe-area-inset-bottom)");
    expect(css).toContain("bottom: 0 !important");
  });

  it("keeps cards and forms inside narrow screens", () => {
    expect(css).toContain("grid-template-columns: minmax(0, 1fr) !important");
    expect(css).toContain("width: 100%; min-width: 0; max-width: 100%");
    expect(css).toContain("overflow-x: auto");
  });

  it("provides touch-size controls and a scrollable More sheet", () => {
    expect(css).toContain("min-height: 44px");
    expect(css).toContain("body > .nav-menu.is-mobile-sheet");
    expect(css).toContain("overflow-y: auto !important");
  });

  it("stacks chat and preserves a visible composer", () => {
    expect(css).toContain(".wc-shell.has-thread .wc-side { display: none; }");
    expect(css).toContain(".wc-pane .wa-composer { position: relative");
    expect(css).toContain("overflow-y: scroll !important");
    expect(css).toContain("-webkit-overflow-scrolling: touch");
    expect(css).toContain(".wc-pane .wa-stage::-webkit-scrollbar-thumb");
  });

  it("keeps the footer compact and above the mobile navigation", () => {
    expect(css).toContain(".site-footer-inner");
    expect(css).toContain("min-height: 3.25rem");
    expect(css).toContain("margin-bottom: calc(4.65rem + env(safe-area-inset-bottom))");
    expect(css).not.toContain("footer { padding-bottom: 5.5rem; }");
  });

  it("overrides the legacy vertical Likes tabs with a horizontal strip", () => {
    expect(css).toContain(".inbox-tabs { flex-direction: row !important");
    expect(css).toContain(".inbox-tab-shell");
    expect(css).toContain("scroll-behavior: smooth");
  });

  it("uses one full-width page frame and a mobile-safe theme picker", () => {
    expect(css).toContain(".app-main:not(.is-bleed)");
    expect(css).toContain(".app-main > .sx-stage");
    expect(css).toContain("width: 100%");
    expect(css).toContain(".theme-quick-menu");
    expect(css).toContain("position: fixed");
  });

  it("applies the shared Gen-Z finish across every page family", () => {
    expect(css).toContain("Universal Gen-Z finish");
    expect(css).toContain(".profile-wizard, .profile-readiness, .portrait-group");
    expect(css).toContain(".desk-panel, .desk-admin-block, .desk-break-card");
    expect(css).toContain(".sx-board, .sx-card, .alert-card, .plan-card");
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");
    expect(css).toContain(".public-card-grid");
    expect(css).toContain(".login-genz-action");
    expect(css).toContain(".profile-create-shell");
    expect(css).toContain(".home-value-card");
  });
});
