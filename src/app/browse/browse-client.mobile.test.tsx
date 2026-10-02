// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BrowseClient } from "./browse-client";
import { EMPTY_BROWSE_FILTERS } from "@/lib/match/browse-filters";
import type { BrowseView } from "@/lib/match/browse-match";

const scrollBy = vi.fn();
const scrollIntoView = vi.fn();
const views: BrowseView[] = [
  "fits",
  "prefers",
  "kundali",
  "nearby",
  "community",
  "viewed_you",
  "you_viewed",
  "custom",
];
const lists = Object.fromEntries(views.map((view) => [view, []])) as Record<BrowseView, []>;

afterEach(cleanup);

beforeEach(() => {
  scrollBy.mockClear();
  scrollIntoView.mockClear();
  Object.defineProperty(HTMLElement.prototype, "scrollBy", { configurable: true, value: scrollBy });
  Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
    configurable: true,
    value: scrollIntoView,
  });
});

describe("Discover mobile tabs", () => {
  function show() {
    return render(
      <BrowseClient
        lookingFor="Bride / Vadhu"
        notice={null}
        user
        initialView="fits"
        initialFilters={EMPTY_BROWSE_FILTERS}
        catalog={{}}
        lists={lists}
        religions={[]}
        communities={[]}
      />,
    );
  }

  it("keeps every Discover option available", () => {
    show();
    for (const label of [
      "Best match",
      "They like you",
      "Kundali",
      "Nearby",
      "Same community",
      "Who viewed you",
      "You viewed",
      "Advanced filter",
    ]) {
      expect(screen.getByRole("button", { name: new RegExp(label, "i") })).toBeTruthy();
    }
  });

  it("moves the options with both arrow controls", () => {
    show();
    fireEvent.click(screen.getByRole("button", { name: "Show more Discover options" }));
    expect(scrollBy).toHaveBeenCalledWith({ left: 260, behavior: "smooth" });

    fireEvent.click(screen.getByRole("button", { name: "Show previous Discover options" }));
    expect(scrollBy).toHaveBeenCalledWith({ left: -260, behavior: "smooth" });
  });

  it("centres a selected option", () => {
    show();
    const nearby = screen.getByRole("button", { name: /nearby/i });
    fireEvent.click(nearby);
    expect(nearby.getAttribute("aria-current")).toBe("page");
    expect(scrollIntoView).toHaveBeenCalled();
  });
});
