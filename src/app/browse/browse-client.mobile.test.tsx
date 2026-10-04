// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BrowseClient } from "./browse-client";
import { EMPTY_BROWSE_FILTERS } from "@/lib/match/browse-filters";
import type { BrowseView } from "@/lib/match/browse-match";

const scrollBy = vi.fn();
const views: BrowseView[] = ["fits", "prefers", "kundali", "nearby", "community", "custom"];
const lists = Object.fromEntries(views.map((view) => [view, []])) as Record<BrowseView, []>;

afterEach(cleanup);

beforeEach(() => {
  scrollBy.mockClear();
  Object.defineProperty(HTMLElement.prototype, "scrollBy", { configurable: true, value: scrollBy });
});

describe("Discover feed", () => {
  it("shows every category as its own row", () => {
    render(
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
    for (const label of ["Today’s picks", "They like you", "Kundali match", "Nearby", "Same community", "Advanced filter"]) {
      expect(screen.getByRole("heading", { name: label })).toBeTruthy();
    }
    expect(screen.getByText(/choose filters, then tap apply/i)).toBeTruthy();
  });

  it("scrolls a category row with both arrows", () => {
    render(
      <BrowseClient
        lookingFor="Bride / Vadhu"
        notice={null}
        user
        initialView="fits"
        initialFilters={EMPTY_BROWSE_FILTERS}
        catalog={{
          a: { id: "a", href: "/browse/a", name: "A" },
          b: { id: "b", href: "/browse/b", name: "B" },
        }}
        lists={{ ...lists, fits: [{ id: "a", score: null }, { id: "b", score: null }] }}
        religions={[]}
        communities={[]}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Show more Today’s picks profiles" }));
    expect(scrollBy).toHaveBeenCalledWith({ left: 280, behavior: "smooth" });
    fireEvent.click(screen.getByRole("button", { name: "Show previous Today’s picks profiles" }));
    expect(scrollBy).toHaveBeenCalledWith({ left: -280, behavior: "smooth" });
  });
});
