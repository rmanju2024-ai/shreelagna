import { describe, expect, it } from "vitest";
import { activeContactFlags, contactTextHash, contentFlags } from "./content-flags";

describe("content flags", () => {
  it("flags phone, email, and WhatsApp", () => {
    expect(contentFlags("Call 9876543210 or meera@mail.com")).toEqual(["phone", "email"]);
    expect(contentFlags("WhatsApp 9876543210")).toEqual(["phone", "whatsapp"]);
    expect(contentFlags("See www.example.com")).toEqual(["web"]);
  });

  it("ignores clean copy", () => {
    expect(contentFlags("I enjoy reading and temple visits.")).toEqual([]);
  });

  it("hides flags after staff clear until the text changes", () => {
    const about = "Reach me on 9876543210";
    const hash = contactTextHash(about);
    expect(activeContactFlags(about, hash)).toEqual([]);
    expect(activeContactFlags(`${about} now`, hash)).toEqual(["phone"]);
  });
});
