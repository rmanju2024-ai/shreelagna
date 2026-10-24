import { describe, expect, it } from "vitest";
import { SITE_BRAND, watermarkLine } from "./brand";

describe("watermark line", () => {
  it("joins the given name with the site", () => {
    expect(watermarkLine("Rohan")).toBe(`Rohan · ${SITE_BRAND}`);
  });

  it("falls back to the site name", () => {
    expect(watermarkLine("  ")).toBe(SITE_BRAND);
  });
});
