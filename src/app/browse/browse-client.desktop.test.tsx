// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { ComponentProps } from "react";
import { BrowseClient, DISCOVER_ROW_WINDOW, discoverResultsHref } from "./browse-client";
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

function makeProfiles(count: number) {
  const catalog: Record<string, BrowseCardNote> = {};
  const rows: BrowseScoreRow[] = [];
  for (let i = 0; i < count; i += 1) {
    const id = `p${i}`;
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
      religions={["Hindu"]}
      communities={["Brahmin"]}
      {...extra}
    />,
  );
}

afterEach(cleanup);

describe("laptop Discover browsing", () => {
  it("shows the search hero, filter control and journey icons together", () => {
    show();
    expect(screen.getByRole("heading", { level: 1, name: "Find your Bride" })).toBeTruthy();
    expect(screen.getByRole("link", { name: /open advanced filter/i }).getAttribute("href")).toBe("/browse/filter");
    expect(screen.getByText("Filter matches")).toBeTruthy();
    expect(screen.getByRole("navigation", { name: "Your Discover journey" })).toBeTruthy();
    expect(screen.getByRole("link", { name: /shortlist — families you saved/i })).toBeTruthy();
    expect(screen.getByRole("link", { name: /blocked — families you chose not to see/i })).toBeTruthy();
  });

  it("keeps category rows and lets a laptop user page cards then open the full list", () => {
    const { catalog, rows } = makeProfiles(6);
    show({ catalog, lists: { ...emptyLists(), smart: rows } });
    expect(screen.getByRole("heading", { name: "Smart picks" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Kundali match" })).toBeTruthy();
    expect(screen.getAllByRole("link", { name: /name \d/i })).toHaveLength(DISCOVER_ROW_WINDOW);
    fireEvent.click(screen.getByRole("button", { name: "Show more Smart picks profiles" }));
    expect(screen.getByRole("link", { name: /name 4/i })).toBeTruthy();
    expect(screen.getByRole("link", { name: /view all 6 profiles/i }).getAttribute("href")).toBe(
      discoverResultsHref("smart"),
    );
  });

  it("opens a tall results list with paging on a laptop", () => {
    const { catalog, rows } = makeProfiles(11);
    show({ catalog, lists: { ...emptyLists(), smart: rows }, fullResults: true });
    expect(screen.getByRole("heading", { level: 1, name: "Smart picks" })).toBeTruthy();
    expect(screen.getByRole("link", { name: /back to discover/i })).toBeTruthy();
    expect(screen.queryByRole("link", { name: /open advanced filter/i })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /next/i }));
    expect(screen.getByRole("link", { name: /name 10/i })).toBeTruthy();
  });

  it("lets a guest start from Discover without member rows", () => {
    show({ user: false, notice: "Sign in and create a profile to search families." });
    expect(screen.getByRole("link", { name: /sign in with gmail/i }).getAttribute("href")).toBe("/login");
    expect(screen.queryByRole("navigation", { name: "Your Discover journey" })).toBeNull();
    expect(screen.queryByRole("heading", { name: "Smart picks" })).toBeNull();
  });
});
