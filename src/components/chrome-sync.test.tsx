// @vitest-environment jsdom

import { cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CHROME_BADGE_REFRESH_MS, ChromeSync } from "./chrome-sync";

const refresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}));

afterEach(() => {
  cleanup();
  refresh.mockClear();
});

describe("ChromeSync", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("does not refresh the whole site 1.5s after a click", () => {
    render(<ChromeSync />);
    vi.advanceTimersByTime(1_500);
    expect(refresh).not.toHaveBeenCalled();
  });

  it("quietly refreshes badges a few minutes later while the tab is visible", () => {
    Object.defineProperty(document, "visibilityState", { configurable: true, value: "visible" });
    render(<ChromeSync />);
    vi.advanceTimersByTime(CHROME_BADGE_REFRESH_MS);
    expect(refresh).toHaveBeenCalledTimes(1);
  });
});
