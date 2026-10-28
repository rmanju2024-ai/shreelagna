import { describe, expect, it } from "vitest";
import { getGreeting } from "./banner-greeting-card";

function atHour(hour: number) {
  return new Date(2026, 9, 28, hour, 0, 0);
}

describe("home greeting", () => {
  it("uses a daytime welcome, not a closing good night", () => {
    expect(getGreeting(atHour(8)).text).toBe("Good Morning");
    expect(getGreeting(atHour(13)).text).toBe("Good Afternoon");
    expect(getGreeting(atHour(19)).text).toBe("Good Evening");
    expect(getGreeting(atHour(22)).text).toBe("Welcome tonight");
    expect(getGreeting(atHour(1)).text).toBe("Welcome tonight");
    expect(getGreeting(atHour(22)).text).not.toMatch(/good night/i);
  });
});
