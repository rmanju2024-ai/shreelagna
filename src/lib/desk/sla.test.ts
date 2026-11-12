import { describe, expect, it } from "vitest";
import { defaultDueIso, fitsQueue, impliedDueAt, isOverdueCase, parseQueueView, slaChip } from "./sla";
import { MEDIA_REJECT_REASONS, parseMediaRejectReason } from "./media-review";
import { orderedProfilePair, parseSafetyEnforce } from "./safety-actions";

describe("desk SLA queue", () => {
  it("treats missing due as 24h from created", () => {
    const created = "2026-11-12T00:00:00.000Z";
    const due = impliedDueAt(created, null);
    expect(due).toBe("2026-11-13T00:00:00.000Z");
    expect(isOverdueCase({ createdAt: created, status: "new", now: Date.parse("2026-11-13T01:00:00.000Z") })).toBe(true);
    expect(isOverdueCase({ createdAt: created, status: "done", now: Date.parse("2026-11-13T01:00:00.000Z") })).toBe(false);
  });

  it("filters mine, unassigned, overdue", () => {
    const row = { assignedTo: "desk", createdAt: "2026-11-10T00:00:00.000Z", status: "new" };
    expect(fitsQueue(row, "mine", "desk")).toBe(true);
    expect(fitsQueue(row, "unassigned", "desk")).toBe(false);
    expect(fitsQueue({ ...row, assignedTo: null }, "unassigned", "desk")).toBe(true);
    expect(fitsQueue(row, "overdue", "desk",)).toBe(true);
    expect(parseQueueView("mine")).toBe("mine");
    expect(parseQueueView("nope")).toBe("all");
  });

  it("labels unassigned vs late", () => {
    expect(slaChip({ status: "new", assignedTo: null }).tone).toBe("warn");
    expect(slaChip({ status: "done" }).label).toBe("Closed");
    expect(defaultDueIso(new Date("2026-11-12T00:00:00.000Z"))).toBe("2026-11-13T00:00:00.000Z");
  });
});

describe("media reject reasons", () => {
  it("accepts known codes only", () => {
    expect(parseMediaRejectReason("blur")).toBe("blur");
    expect(parseMediaRejectReason("nope")).toBeNull();
    expect(MEDIA_REJECT_REASONS.length).toBeGreaterThanOrEqual(5);
  });
});

describe("safety enforce flags", () => {
  it("orders a thread pair and reads checkboxes", () => {
    expect(orderedProfilePair("b", "a")).toEqual(["a", "b"]);
    expect(parseSafetyEnforce({ hide: "on", block: "true", freeze: "1" })).toEqual({
      hide: true,
      block: true,
      freeze: true,
    });
    expect(parseSafetyEnforce({}).hide).toBe(false);
  });
});
