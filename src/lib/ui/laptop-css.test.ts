import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const genz = readFileSync(resolve(process.cwd(), "src/app/theme-genz.css"), "utf8");
const search = readFileSync(resolve(process.cwd(), "src/app/search-modern.css"), "utf8");

describe("laptop website browsing layout", () => {
  it("keeps Discover hero as a two-column header with a side filter", () => {
    expect(search).toContain("grid-template-columns: minmax(0, 1fr) auto");
    expect(search).toContain(".sx-filter-link");
    expect(search).toContain(".sx-journey");
  });

  it("lays Discover cards in a multi-column grid and a side-scrolling row", () => {
    expect(search).toContain("grid-template-columns: repeat(auto-fill, minmax(16.5rem, 1fr))");
    expect(search).toContain(".sx-feed .sx-row");
    expect(search).toContain("display: flex; flex-flow: row nowrap");
    expect(search).toContain(".sx-row-shell");
    expect(search).toContain("grid-template-columns: 2.4rem minmax(0, 1fr) 2.4rem");
  });

  it("pins laptop navigation in the header instead of a phone dock", () => {
    expect(genz).toContain(".site-head-inner > .site-nav {");
    expect(genz).toContain("position: static");
    expect(genz).toContain("max-width: min(100%, 48rem)");
  });

  it("does not force laptop pages into a single column outside the phone breakpoint", () => {
    const beforePhone = genz.slice(0, genz.indexOf("@media (max-width: 820px)"));
    expect(beforePhone).not.toContain("grid-template-columns: 1fr !important");
    expect(search).toContain("repeat(auto-fill, minmax(16.5rem, 1fr))");
  });
});
