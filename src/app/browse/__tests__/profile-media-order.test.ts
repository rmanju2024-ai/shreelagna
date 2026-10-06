import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const css = readFileSync(resolve(process.cwd(), "src/app/search-modern.css"), "utf8");

describe("browse profile media order", () => {
  it("keeps photos in the right column on desktop", () => {
    expect(css).toContain("grid-template-columns: minmax(0, 1fr) minmax(16rem, 20rem)");
  });

  it("lifts the photo column above details on stacked phones", () => {
    const phone = css.split("@media (max-width: 900px)")[1] ?? "";
    expect(phone).toContain(".pv-shell .pv-media-col");
    expect(phone).toContain("order: -1");
  });
});
