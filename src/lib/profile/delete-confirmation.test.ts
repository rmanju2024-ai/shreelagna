import { describe, expect, it } from "vitest";
import { hasDeleteConfirmation } from "./delete-confirmation";

describe("hasDeleteConfirmation", () => {
  it("accepts the confirmation word regardless of surrounding whitespace or case", () => {
    expect(hasDeleteConfirmation("DELETE")).toBe(true);
    expect(hasDeleteConfirmation(" delete ")).toBe(true);
  });

  it.each([undefined, null, "", "delete profile", "DELETE!", 42, {}])(
    "rejects an unsafe confirmation: %j",
    (value) => {
      expect(hasDeleteConfirmation(value)).toBe(false);
    },
  );
});
