import { describe, expect, it } from "vitest";
import { isOnlineNow, lastOnlineLine, parseSeen, shouldTouchLastSeen } from "./last-seen";

describe("last seen", () => {
  it("treats naive timestamps as UTC", () => {
    const zoned = parseSeen("2026-09-24T14:00:00Z")?.getTime();
    expect(parseSeen("2026-09-24T14:00:00")?.getTime()).toBe(zoned);
    expect(parseSeen("2026-09-24 14:00:00")?.getTime()).toBe(zoned);
    expect(parseSeen("2026-09-24T14:00:00.123456+00:00")?.getTime()).toBe(
      parseSeen("2026-09-24T14:00:00.123+00:00")?.getTime(),
    );
  });

  it("prints IST clock time instead of a shifted relative hour", () => {
    const now = Date.parse("2026-09-24T14:00:00Z");
    expect(isOnlineNow("2026-09-24T13:58:00Z", now)).toBe(true);
    expect(lastOnlineLine("2026-09-24T13:58:00Z", null, now)).toBe("Online now");
    expect(lastOnlineLine("2026-09-24T08:30:00", null, now)).toBe("Last seen today at 2:00 pm IST");
    expect(shouldTouchLastSeen("2026-09-22T15:17:00Z", now)).toBe(true);
  });
});
