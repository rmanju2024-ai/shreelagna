import { describe, expect, it } from "vitest";
import { ticketPreview } from "./ticket-rows";

describe("ticket preview", () => {
  it("shortens a long family message for the list", () => {
    expect(ticketPreview("Hi there")).toBe("Hi there");
    expect(ticketPreview("x".repeat(100)).endsWith("…")).toBe(true);
    expect(ticketPreview("  ")).toBe("No message");
  });
});
