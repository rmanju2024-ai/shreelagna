import { describe, expect, it } from "vitest";
import { pulseNote, pulseWarmth, tallyMonthPulse } from "./month-pulse";

describe("month pulse", () => {
  it("scores views, requests and accepts", () => {
    expect(pulseWarmth({ views: 2, received: 1, sent: 0, accepted: 0 })).toBe(20);
    expect(pulseWarmth({ views: 10, received: 3, sent: 2, accepted: 1 })).toBe(100);
  });

  it("counts only activity inside the window", () => {
    const pulse = tallyMonthPulse({
      views: 4,
      since: "2026-09-05T00:00:00.000Z",
      received: [
        { created_at: "2026-09-20T00:00:00.000Z", status: "pending" },
        { created_at: "2026-08-01T00:00:00.000Z", status: "accepted", responded_at: "2026-08-02T00:00:00.000Z" },
      ],
      sent: [{ created_at: "2026-09-10T00:00:00.000Z", status: "accepted", responded_at: "2026-09-12T00:00:00.000Z" }],
    });
    expect(pulse.views).toBe(4);
    expect(pulse.received).toBe(1);
    expect(pulse.sent).toBe(1);
    expect(pulse.accepted).toBe(1);
    expect(pulseNote(pulse.warmth)).toContain("steady");
  });
});
