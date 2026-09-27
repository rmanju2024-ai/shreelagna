import { describe, expect, it } from "vitest";
import { parseContactForm } from "@/lib/validation/contact";

describe("parseContactForm", () => {
  const valid = {
    name: "Anita Rao",
    email: "anita@gmail.com",
    mobile: "9876543210",
    city: "Chennai",
    enquiry_type: "vadhu" as const,
    message: "Please help us create a profile for my daughter.",
    company: "",
  };

  it("accepts a complete enquiry", () => {
    const r = parseContactForm(valid);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.spam).toBe(false);
  });

  it("rejects a short name", () => {
    const r = parseContactForm({ ...valid, name: "A" });
    expect(r.ok).toBe(false);
  });

  it("rejects a short message", () => {
    const r = parseContactForm({ ...valid, message: "Hi" });
    expect(r.ok).toBe(false);
  });

  it("treats honeypot as spam without failing loudly", () => {
    const r = parseContactForm({ ...valid, company: "bot" });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.spam).toBe(true);
  });

  it("allows empty email", () => {
    const r = parseContactForm({ ...valid, email: "" });
    expect(r.ok).toBe(true);
  });
});
