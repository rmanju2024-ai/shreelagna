import { describe, expect, it } from "vitest";
import { EVIDENCE_RETENTION_DAYS, EVIDENCE_RETENTION_NOTICE } from "./copy";
import { evidenceDeleteAfter } from "./evidence";

describe("verification evidence retention", () => {
  it("deletes files as soon as review is complete", () => {
    expect(EVIDENCE_RETENTION_DAYS).toBe(0);
    const from = new Date("2026-10-06T12:00:00.000Z");
    expect(evidenceDeleteAfter(from)).toBe("2026-10-06T12:00:00.000Z");
    expect(EVIDENCE_RETENTION_NOTICE).toBe(
      "Documents are deleted as soon as review is complete. Your profile keeps only the result.",
    );
  });
});
