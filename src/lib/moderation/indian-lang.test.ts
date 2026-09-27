import { describe, expect, it } from "vitest";
import { detectReviewLang } from "./indian-lang";

describe("detectReviewLang", () => {
  it("detects common Indian scripts", () => {
    expect(detectReviewLang("എന്റെ പേര് മീര").name).toBe("Malayalam");
    expect(detectReviewLang("मेरा नाम मीरा है").name).toBe("Hindi");
    expect(detectReviewLang("என் பெயர் மீரா").name).toBe("Tamil");
    expect(detectReviewLang("I enjoy temple visits.").name).toBe("English");
  });
});
