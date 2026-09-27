import { describe, expect, it } from "vitest";
import { isIndiaMobile, toWhatsAppNumber } from "./phone";

describe("WhatsApp numbers", () => {
  it("prefixes 10-digit India mobiles with 91", () => {
    expect(toWhatsAppNumber("9876543210")).toBe("919876543210");
    expect(toWhatsAppNumber("+91 98765 43210")).toBe("919876543210");
    expect(toWhatsAppNumber("09876543210")).toBe("919876543210");
    expect(isIndiaMobile("9876543210")).toBe(true);
  });

  it("rejects short or empty values", () => {
    expect(toWhatsAppNumber("12345")).toBeNull();
    expect(toWhatsAppNumber("")).toBeNull();
    expect(isIndiaMobile("123")).toBe(false);
  });
});
