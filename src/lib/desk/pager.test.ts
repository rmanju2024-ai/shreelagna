import { describe, expect, it } from "vitest";
import { deskPage, deskRange } from "./pager";

describe("desk paging", () => {
  it.each([undefined, null, "", "0", "-3", "1.5", "NaN", "abc"])(
    "falls back to page one for an invalid page: %j",
    (value) => {
      expect(deskPage(value)).toBe(1);
    },
  );

  it("keeps a valid positive integer page", () => {
    expect(deskPage("3")).toBe(3);
  });

  it("never creates a negative database range", () => {
    expect(deskRange(-8)).toEqual({ from: 0, to: 19 });
    expect(deskRange(3, 10)).toEqual({ from: 20, to: 29 });
  });
});
