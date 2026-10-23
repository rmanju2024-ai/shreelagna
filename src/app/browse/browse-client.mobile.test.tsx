// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { ComponentProps } from "react";
import {
  BrowseClient,
  DISCOVER_CARD_STRIDE_REM,
  DISCOVER_PREVIEW_LIMIT,
  discoverResultsHref,
  discoverRowStart,
} from "./browse-client";
import { EMPTY_BROWSE_FILTERS } from "@/lib/match/browse-filters";
import type { BrowseView } from "@/lib/match/browse-match";
import type { BrowseCardNote } from "./browse-card";
import type { BrowseScoreRow } from "@/lib/match/browse-match";


function emptyLists(): Record<BrowseView, BrowseScoreRow[]> {
  return {
    smart: [],
    fits: [],
    prefers: [],
    kundali: [],
    nearby: [],
    community: [],
    custom: [],
  };
}

function makeProfiles(count: number, prefix = "p") {
  const catalog: Record<string, BrowseCardNote> = {};
  const rows: BrowseScoreRow[] = [];
  for (let i = 0; i < count; i += 1) {
    const id = `${prefix}${i}`;
    catalog[id] = {
      id,
      href: `/browse/${id}`,
      name: `Name ${i}`,
      city: "Bengaluru",
      state: "Karnataka",
      date_of_birth: "1996-01-15",
    };
    rows.push({ id, score: "13/15 of your preference" });
  }
  return { catalog, rows };
}

function show(extra: Partial<ComponentProps<typeof BrowseClient>> = {}) {
  return render(
    <BrowseClient
      lookingFor="Bride"
      notice={null}
      user
      initialView="smart"
      initialFilters={EMPTY_BROWSE_FILTERS}
      catalog={{}}
      lists={emptyLists()}
      religions={[]}
      communities={[]}
      {...extra}
    />,
  );
}

afterEach(cleanup);

describe("discoverRowStart", () => {
  it("steps one card and stops at the last full window", () => {
    expect(discoverRowStart(0, 1, 11)).toBe(1);
    expect(discoverRowStart(9, 1, 11)).toBe(10);
    expect(discoverRowStart(10, 1, 11)).toBe(10);
    expect(discoverRowStart(1, -1, 11)).toBe(0);
    expect(discoverRowStart(0, -1, 11)).toBe(0);
  });
});

describe("discoverResultsHref", () => {
  it("keeps the selected category and custom filters", () => {
    expect(discoverResultsHref("smart")).toBe("/browse/results?view=smart");
    expect(discoverResultsHref("custom", { ...EMPTY_BROWSE_FILTERS, ageMin: 25, city: ["Bengaluru"] })).toBe(
      "/browse/results?view=custom&age_min=25&city=Bengaluru",
    );
  });
});

describe("Discover feed", () => {
  it("shows every category as its own row", () => {
    show();
    for (const label of ["Smart picks", "Kundali match", "Nearby", "Same community"]) {
      expect(screen.getAllByRole("heading", { name: label })).toHaveLength(1);
    }
    expect(screen.queryByRole("link", { name: /view all/i })).toBeNull();
  });

  it("prints each category title once", () => {
    show();
    expect(screen.getAllByText("Smart picks")).toHaveLength(1);
    expect(screen.getAllByText("The introductions we’d put first")).toHaveLength(1);
  });

  it("moves a category row one card with the arrows", () => {
    const { catalog, rows } = makeProfiles(6);
    show({ catalog, lists: { ...emptyLists(), smart: rows } });
    const track = document.querySelector(".sx-row");
    expect(track?.getAttribute("data-start")).toBe("0");
    fireEvent.click(screen.getByRole("button", { name: "Show more Smart picks profiles" }));
    expect(track?.getAttribute("data-start")).toBe("1");
    expect((track as HTMLElement | null)?.style.marginLeft).toBe(`-${DISCOVER_CARD_STRIDE_REM}rem`);
    fireEvent.click(screen.getByRole("button", { name: "Show previous Smart picks profiles" }));
    expect(track?.getAttribute("data-start")).toBe("0");
  });

  it("keeps the row cards and links View all to that category", () => {
    const { catalog, rows } = makeProfiles(DISCOVER_PREVIEW_LIMIT + 2);
    show({ catalog, lists: { ...emptyLists(), smart: rows } });
    expect(screen.getAllByRole("link", { name: /name \d/i })).toHaveLength(DISCOVER_PREVIEW_LIMIT + 2);
    const viewAll = screen.getByRole("link", { name: /view all 7 profiles/i });
    expect(viewAll.getAttribute("href")).toBe("/browse/results?view=smart");
  });

  it("links to the advanced filter page without listing profiles", () => {
    const { catalog, rows } = makeProfiles(3, "c");
    show({ catalog, lists: { ...emptyLists(), custom: rows } });
    expect(screen.queryByRole("link", { name: /name 0/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /^apply$/i })).toBeNull();
    expect(screen.queryByRole("heading", { name: "Advanced filter" })).toBeNull();
    expect(screen.getByRole("link", { name: /open advanced filter/i }).getAttribute("href")).toBe("/browse/filter");
  });

  it("filter page lists nothing until Apply", () => {
    const { catalog, rows } = makeProfiles(3, "c");
    show({ catalog, lists: { ...emptyLists(), custom: rows }, initialView: "custom", filterPage: true });
    expect(screen.queryByRole("link", { name: /name 0/i })).toBeNull();
    expect(screen.getByRole("link", { name: /back to discover/i }).getAttribute("href")).toBe("/browse");
    fireEvent.click(screen.getByRole("button", { name: /^apply$/i }));
    expect(screen.getByRole("link", { name: /name 0/i })).toBeTruthy();
  });
});

describe("Discover results", () => {
  it("lists one category vertically with ten per page", () => {
    const { catalog, rows } = makeProfiles(11);
    show({ catalog, lists: { ...emptyLists(), smart: rows }, fullResults: true });
    expect(screen.getByRole("heading", { level: 1, name: "Smart picks" })).toBeTruthy();
    expect(screen.getByRole("link", { name: /back to discover/i }).getAttribute("href")).toBe("/browse?view=smart");
    expect(screen.getByRole("link", { name: /name 0/i })).toBeTruthy();
    expect(screen.queryByRole("link", { name: /name 10/i })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /next/i }));
    expect(screen.getByRole("link", { name: /name 10/i })).toBeTruthy();
    expect(screen.queryByRole("link", { name: /name 0/i })).toBeNull();
  });

  it("shows the member and error gates", () => {
    show({ notice: "Create a profile first, then search.", user: false });
    expect(screen.getByRole("heading", { name: /begin with a profile/i })).toBeTruthy();
    expect(screen.getByRole("link", { name: /sign in with gmail/i })).toBeTruthy();
    expect(screen.queryByRole("heading", { name: "Smart picks" })).toBeNull();

    cleanup();
    show({ error: "unavailable" });
    expect(screen.getByText(/hidden or no longer available/i)).toBeTruthy();
  });
});
