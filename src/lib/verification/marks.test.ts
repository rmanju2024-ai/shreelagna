import { describe, expect, it } from "vitest";
import { verificationMarks } from "./marks";

describe("verificationMarks", () => {
  it("lists mobile, email and the three document checks", () => {
    const marks = verificationMarks({ mobile: true, email: false, cases: [] });
    expect(marks.map((item) => item.label)).toEqual(["Mobile", "Email", "Identity", "Education", "Work"]);
    expect(marks.find((item) => item.id === "mobile")?.on).toBe(true);
    expect(marks.find((item) => item.id === "email")?.on).toBe(false);
    expect(marks.filter((item) => item.id !== "mobile").every((item) => !item.on)).toBe(true);
  });

  it("treats an approved case as verified even if a later request exists", () => {
    const marks = verificationMarks({
      mobile: false,
      email: true,
      cases: [
        { document_type: "identity", status: "rejected" },
        { document_type: "identity", status: "approved" },
        { document_type: "education", status: "in_review" },
      ],
    });
    expect(marks.find((item) => item.id === "identity")?.on).toBe(true);
    expect(marks.find((item) => item.id === "education")?.on).toBe(false);
    expect(marks.find((item) => item.id === "email")?.on).toBe(true);
  });
});
