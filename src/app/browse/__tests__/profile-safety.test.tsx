// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const push = vi.fn();
const back = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push, back }) }));
vi.mock("@/app/app/safety/actions", () => ({ blockProfile: vi.fn(), reportProfile: vi.fn() }));

import { BackLink } from "@/components/back-link";
import { PromoBubble } from "@/app/browse/promo-bubble";
import { SafetyFlash } from "@/app/browse/safety-flash";
import { SafetyProfileControl } from "@/app/app/safety/safety-profile-control";

function setReferrer(value: string, length = 3) {
  Object.defineProperty(document, "referrer", { value, configurable: true });
  Object.defineProperty(window.history, "length", { value: length, configurable: true });
}

describe("profile safety and close behaviour", () => {
  afterEach(() => cleanup());
  beforeEach(() => {
    push.mockClear();
    back.mockClear();
    sessionStorage.clear();
  });

  it("goes back when the member came from inside the app", () => {
    setReferrer(`${window.location.origin}/browse`);
    render(<BackLink fallback="/browse">Close</BackLink>);
    fireEvent.click(screen.getByText("Close"));
    expect(back).toHaveBeenCalled();
    expect(push).not.toHaveBeenCalled();
  });

  it("falls back to the list when there is no history or the referrer is the report form", () => {
    setReferrer("", 1);
    const { unmount } = render(<BackLink fallback="/browse">Close</BackLink>);
    fireEvent.click(screen.getByText("Close"));
    expect(push).toHaveBeenCalledWith("/browse");
    unmount();
    setReferrer(`${window.location.origin}/browse/abc/report`);
    render(<BackLink fallback="/browse/abc">Cancel</BackLink>);
    fireEvent.click(screen.getByText("Cancel"));
    expect(push).toHaveBeenCalledWith("/browse/abc");
  });

  it("asks before blocking and can be cancelled", () => {
    const { container } = render(<SafetyProfileControl profileId="p1" returnTo="/browse/p1" name="Asha" />);
    fireEvent.click(screen.getByText(/Block/));
    expect(screen.getByText(/Block Asha\?/)).toBeTruthy();
    expect(container.querySelector('input[name="profile_id"]')?.getAttribute("value")).toBe("p1");
    fireEvent.click(screen.getByText("Keep"));
    expect(screen.queryByText(/Block Asha\?/)).toBeNull();
  });

  it("report opens its own page", () => {
    render(<SafetyProfileControl profileId="p1" returnTo="/browse/p1" />);
    expect(screen.getByText(/Report/).getAttribute("href")).toBe("/browse/p1/report");
  });

  it("shows feedback after blocking or reporting", () => {
    const { rerender } = render(<SafetyFlash code="blocked" />);
    expect(screen.getByRole("status").textContent).toMatch(/blocked/i);
    rerender(<SafetyFlash code="reported" />);
    expect(screen.getByRole("status").textContent).toMatch(/report/i);
    rerender(<SafetyFlash code="nope" />);
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("promo bubble opens, closes and stays closed for the session", () => {
    vi.useFakeTimers();
    const { unmount } = render(<PromoBubble name="Asha" />);
    expect(screen.queryByLabelText("Premium offer")).toBeNull();
    act(() => {
      vi.advanceTimersByTime(4100);
    });
    expect(screen.getByText(/Asha could be your match/)).toBeTruthy();
    expect(screen.getByText("Unlock premium ✨").getAttribute("href")).toBe("/app/plans");
    fireEvent.click(screen.getByLabelText("Close"));
    expect(screen.queryByText(/could be your match/)).toBeNull();
    unmount();
    render(<PromoBubble name="Asha" />);
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(screen.queryByLabelText("Premium offer")).toBeNull();
    vi.useRealTimers();
  });
});
