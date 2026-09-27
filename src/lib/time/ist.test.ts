import { describe, expect, it } from "vitest";
import {
  formatIstChatStamp,
  formatIstDateTime,
  formatIstRelative,
  formatIstTime,
  istDayKey,
  istWeekStartKey,
  parseInstant,
} from "./ist";

describe("IST clock", () => {
  it("prints the India wall clock from a UTC instant", () => {
    const at = parseInstant("2026-09-24T10:11:00Z");
    expect(at).not.toBeNull();
    expect(formatIstTime(at!)).toBe("3:41 pm");
    expect(istDayKey(at!)).toBe("2026-09-24");
  });

  it("uses the IST calendar for today and yesterday", () => {
    const now = Date.parse("2026-09-25T07:25:00Z");
    expect(formatIstRelative("2026-09-25T03:41:00Z", now)).toBe("today at 9:11 am IST");
    expect(formatIstRelative("2026-09-24T10:11:00Z", now)).toBe("yesterday at 3:41 pm IST");
    expect(formatIstDateTime("2026-09-24T18:19:00+05:30")).toBe("24 Sep 2026 · 6:19 pm IST");
  });

  it("treats early IST morning as today even when UTC is still yesterday", () => {
    const now = Date.parse("2026-09-25T07:25:00Z");
    expect(formatIstRelative("2026-09-24T19:30:00Z", now)).toBe("today at 1:00 am IST");
    expect(formatIstChatStamp("2026-09-24T19:30:00Z", now)).toBe("1:00 am");
    expect(formatIstChatStamp("2026-09-24T10:11:00Z", now)).toBe("Yesterday");
  });

  it("starts the IST week on Monday", () => {
    expect(istWeekStartKey(new Date("2026-09-25T10:00:00+05:30"))).toBe("2026-09-21");
    expect(istWeekStartKey(new Date("2026-09-21T00:30:00+05:30"))).toBe("2026-09-21");
  });
});
