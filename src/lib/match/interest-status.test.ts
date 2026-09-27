import { describe, expect, it } from "vitest";
import {
  effectiveInterestStatus,
  formatInboxWhen,
  INTEREST_EXPIRE_DAYS,
  interestStatusLabel,
  interestThreadState,
  isHistoryStatus,
  isStalePending,
  openInterestBlocksSend,
  trimDeclineReason,
} from "./interest-status";

describe("interest status", () => {
  const now = Date.parse("2026-04-01T00:00:00Z");

  it("expires pending notes after 50 days", () => {
    const old = new Date(now - (INTEREST_EXPIRE_DAYS + 1) * 86400000).toISOString();
    expect(isStalePending(old, now)).toBe(true);
    expect(effectiveInterestStatus("pending", old, now)).toBe("expired");
    expect(isHistoryStatus("expired")).toBe(true);
  });

  it("keeps recent pending and accepted notes", () => {
    const fresh = new Date(now - 10 * 86400000).toISOString();
    expect(effectiveInterestStatus("pending", fresh, now)).toBe("pending");
    expect(effectiveInterestStatus("accepted", fresh, now)).toBe("accepted");
    expect(isHistoryStatus("declined")).toBe(true);
    expect(isHistoryStatus("deleted")).toBe(true);
    expect(isHistoryStatus("pending")).toBe(false);
    expect(interestStatusLabel("expired")).toBe("Expired");
    expect(interestStatusLabel("deleted")).toBe("Deleted");
  });

  it("hides send once a thread exists", () => {
    expect(interestThreadState(null, false)).toBe("none");
    expect(interestThreadState("pending", true)).toBe("sent");
    expect(interestThreadState("pending", false)).toBe("received");
    expect(interestThreadState("accepted", true)).toBe("accepted");
    expect(interestThreadState("declined", false)).toBe("closed");
    expect(interestThreadState("expired", true)).toBe("closed");
  });

  it("blocks a reverse send while pending or accepted", () => {
    expect(openInterestBlocksSend("pending")).toBe(true);
    expect(openInterestBlocksSend("accepted")).toBe(true);
    expect(openInterestBlocksSend("declined")).toBe(false);
    expect(openInterestBlocksSend(null)).toBe(false);
    expect(trimDeclineReason("  too far  ")).toBe("too far");
    expect(trimDeclineReason("   ")).toBeNull();
    expect(trimDeclineReason("x".repeat(300))?.length).toBe(280);
  });

  it("prints history date and time", () => {
    expect(formatInboxWhen("2026-04-01T10:05:00+05:30")).toBe("1 Apr 2026 · 10:05 am IST");
  });
});
