// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BirdDock } from "./bird-dock";

vi.mock("@/app/app/profiles/actions", () => ({
  cancelInterest: vi.fn(),
  sendInterest: vi.fn(),
}));
vi.mock("@/app/app/match/actions", () => ({
  markPeekRead: vi.fn(async () => ({})),
  sendPeekChat: vi.fn(async () => ({})),
}));

const props = {
  profileId: "them",
  interestId: "i1",
  thread: "accepted" as const,
  canSend: false,
  needPlan: false,
  needQuota: false,
  quotaLeft: null,
  finishHref: "/app",
  inline: true,
  chat: {
    myProfileId: "me",
    threadId: "t1",
    notes: [] as { id: string; sender_profile_id: string; body: string; created_at: string }[],
    live: true,
    name: "Jayesh",
    photo: null,
    seen: "tap to chat",
  },
};

describe("BirdDock chat chrome", () => {
  beforeEach(() => {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: (query: string) => ({
        matches: true,
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }),
    });
  });
  afterEach(cleanup);

  it("opens chat maximized and closes with the close button only", () => {
    render(<BirdDock {...props} />);
    expect(screen.queryByLabelText("Chat")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /open chat/i }));
    const panel = screen.getByLabelText("Chat");
    expect(panel).toBeTruthy();
    expect(panel.className).toContain("is-max");
    expect(screen.queryByRole("button", { name: /maximize/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /restore/i })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /^close$/i }));
    expect(screen.queryByLabelText("Chat")).toBeNull();
    expect(screen.getByRole("button", { name: /open chat/i })).toBeTruthy();
  });

  it("keeps chat open if the opening tap also hits the scrim", () => {
    render(<BirdDock {...props} />);
    fireEvent.click(screen.getByRole("button", { name: /open chat/i }));
    fireEvent.click(screen.getByRole("button", { name: /dismiss chat backdrop/i }));
    expect(screen.getByLabelText("Chat")).toBeTruthy();
  });
});
