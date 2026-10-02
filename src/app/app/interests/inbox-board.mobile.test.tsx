// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { InboxBoard } from "./inbox-board";

const push = vi.fn();
const scrollBy = vi.fn();
const scrollIntoView = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

vi.mock("@/app/app/match/actions", () => ({
  respondInterest: vi.fn(),
}));

afterEach(cleanup);

beforeEach(() => {
  push.mockClear();
  scrollBy.mockClear();
  scrollIntoView.mockClear();
  Object.defineProperty(HTMLElement.prototype, "scrollBy", {
    configurable: true,
    value: scrollBy,
  });
  Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
    configurable: true,
    value: scrollIntoView,
  });
});

describe("Likes mobile tabs", () => {
  it("keeps every section available in the horizontal tab list", () => {
    render(<InboxBoard received={[]} sent={[]} accepted={[]} history={[]} viewed={[]} visited={[]} />);

    for (const label of ["Received", "Sent", "Accepted", "History", "Who viewed you", "You viewed"]) {
      expect(screen.getByRole("tab", { name: new RegExp(label, "i") })).toBeTruthy();
    }
  });

  it("moves the tab strip with the mobile arrow controls", () => {
    render(<InboxBoard received={[]} sent={[]} accepted={[]} history={[]} />);

    fireEvent.click(screen.getByRole("button", { name: "Show more Likes options" }));
    expect(scrollBy).toHaveBeenCalledWith({ left: 220, behavior: "smooth" });

    fireEvent.click(screen.getByRole("button", { name: "Show previous Likes options" }));
    expect(scrollBy).toHaveBeenCalledWith({ left: -220, behavior: "smooth" });
  });

  it("selects and centres the chosen section", () => {
    render(<InboxBoard received={[]} sent={[]} accepted={[]} history={[]} />);

    const history = screen.getByRole("tab", { name: /history/i });
    fireEvent.click(history);

    expect(history.getAttribute("aria-selected")).toBe("true");
    expect(scrollIntoView).toHaveBeenCalledWith({
      behavior: "smooth",
      inline: "center",
      block: "nearest",
    });
    expect(screen.getByText("No expired, declined, or deleted notes.")).toBeTruthy();
  });
});
