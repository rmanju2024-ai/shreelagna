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

describe("Likes sections", () => {
  const note = (id: string) => ({ id, name: `Name ${id}`, when: "today", href: `/browse/${id}` });
  const many = (count: number) => Array.from({ length: count }, (_, i) => note(`n${i}`));

  it("shows every section as its own row with a count", () => {
    render(<InboxBoard received={[]} sent={many(1)} accepted={[]} history={[]} viewed={many(1)} visited={many(1)} />);
    for (const label of ["Received", "Sent", "Accepted", "History", "Who viewed you", "You viewed"]) {
      expect(screen.getAllByRole("heading", { name: label })).toHaveLength(1);
    }
    expect(screen.getAllByText("1 profile")).toHaveLength(3);
    expect(screen.getAllByText("0 profiles")).toHaveLength(3);
  });

  it("previews five cards and expands on View all", () => {
    render(<InboxBoard received={[]} sent={many(7)} accepted={[]} history={[]} />);
    expect(screen.getAllByRole("link", { name: /name n\d/i })).toHaveLength(5);
    fireEvent.click(screen.getByRole("button", { name: /view all 7 profiles/i }));
    expect(screen.getAllByRole("link", { name: /name n\d/i })).toHaveLength(7);
    fireEvent.click(screen.getByRole("button", { name: /show less/i }));
    expect(screen.getAllByRole("link", { name: /name n\d/i })).toHaveLength(5);
  });

  it("scrolls a row with both arrows", () => {
    render(<InboxBoard received={[]} sent={many(2)} accepted={[]} history={[]} />);
    fireEvent.click(screen.getByRole("button", { name: "Show more Sent profiles" }));
    expect(scrollBy).toHaveBeenCalledWith({ left: 280, behavior: "smooth" });
    fireEvent.click(screen.getByRole("button", { name: "Show previous Sent profiles" }));
    expect(scrollBy).toHaveBeenCalledWith({ left: -280, behavior: "smooth" });
  });

  it("offers Accept and Decline on received cards", () => {
    render(<InboxBoard received={many(1)} sent={[]} accepted={[]} history={[]} />);
    expect(screen.getByRole("button", { name: "Accept" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Decline" })).toBeTruthy();
  });
});
