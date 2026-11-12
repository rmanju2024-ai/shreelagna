import { describe, expect, it } from "vitest";
import { indiaMobileInput, isIndiaMobile, toWhatsAppNumber } from "./phone";

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
    expect(toWhatsAppNumber("91104933661")).toBeNull();
    expect(isIndiaMobile("123")).toBe(false);
    expect(indiaMobileInput("+91 98765 43210")).toBe("9876543210");
    expect(indiaMobileInput("91104933661")).toBe("91104933661");
  });
});
