import { describe, expect, it } from "vitest";
import { EVIDENCE_RETENTION_DAYS, EVIDENCE_RETENTION_NOTICE } from "./copy";
import { evidenceDeleteAfter } from "./evidence";

describe("verification evidence retention", () => {
  it("keeps files for thirty days after review, then they are deleted", () => {
    expect(EVIDENCE_RETENTION_DAYS).toBe(30);
    const from = new Date("2026-10-06T12:00:00.000Z");
    expect(evidenceDeleteAfter(from)).toBe("2026-11-05T12:00:00.000Z");
    expect(EVIDENCE_RETENTION_NOTICE).toContain("30 days");
    expect(EVIDENCE_RETENTION_NOTICE).toContain("do not keep copies on your profile");
  });
});
