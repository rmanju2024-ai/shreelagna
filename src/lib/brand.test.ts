import { describe, expect, it } from "vitest";
import { SITE_NAME, watermarkLine } from "./brand";

describe("watermark line", () => {
  it("joins the given name with the site", () => {
    expect(watermarkLine("Rohan")).toBe(`Rohan · ${SITE_NAME}`);
  });

  it("falls back to the site name", () => {
    expect(watermarkLine("  ")).toBe(SITE_NAME);
  });
});
