// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { BrowseCardNote } from "@/app/browse/browse-card";
import { DeskLookBoard, noteFitsLook, sortLookNotes } from "./desk-look-board";
import { DISCOVER_RESULTS_PAGE_SIZE } from "@/app/browse/browse-client";
import { EMPTY_BROWSE_FILTERS } from "@/lib/match/browse-filters";

afterEach(cleanup);

function note(partial: Partial<BrowseCardNote> & { id: string; name: string }): BrowseCardNote {
  return {
    href: `/browse/${partial.id}`,
    city: "Bengaluru",
    state: "Karnataka",
    date_of_birth: "1996-01-15",
    profile_type: "vadhu",
    current_country: "India",
    ...partial,
  };
}

describe("Desk look board", () => {
  it("lists nothing until Apply, then lists both kinds when Any is kept", () => {
    const notes = [
      note({ id: "b1", name: "Ananya", profile_type: "vadhu" }),
      note({ id: "g1", name: "Arjun", profile_type: "vara" }),
    ];
    render(<DeskLookBoard notes={notes} religions={[]} communities={[]} />);
    expect(screen.getByText(/Choose filters, then tap Apply/i)).toBeTruthy();
    expect(screen.queryByText("Ananya")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Apply" }));
    expect(screen.getByText("Ananya")).toBeTruthy();
    expect(screen.getByText("Arjun")).toBeTruthy();
    expect(screen.getByText("2 profiles")).toBeTruthy();
  });

  it("uses the Discover advanced page size", () => {
    expect(DISCOVER_RESULTS_PAGE_SIZE).toBe(10);
    const notes = Array.from({ length: 12 }, (_, i) =>
      note({ id: `p${i}`, name: `Name ${i}`, profile_type: i % 2 ? "vara" : "vadhu" }),
    );
    render(<DeskLookBoard notes={notes} religions={[]} communities={[]} />);
    fireEvent.click(screen.getByRole("button", { name: "Apply" }));
    expect(screen.getByText("12 profiles")).toBeTruthy();
    expect(screen.getByText("Page 1 of 2")).toBeTruthy();
    expect(screen.queryByText("Name 10")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByText("Name 10")).toBeTruthy();
  });

  it("sorts listed profiles by place", () => {
    const notes = [
      note({ id: "a", name: "Zara", city: "Mysuru", state: "Karnataka", created_at: "2026-01-01" }),
      note({ id: "b", name: "Ananya", city: "Bengaluru", state: "Karnataka", created_at: "2026-02-01" }),
    ];
    expect(sortLookNotes(notes, "place").map((row) => row.name)).toEqual(["Ananya", "Zara"]);
    expect(sortLookNotes(notes, "newest").map((row) => row.name)).toEqual(["Ananya", "Zara"]);
    expect(sortLookNotes(notes, "oldest").map((row) => row.name)).toEqual(["Zara", "Ananya"]);
  });

  it("sorts by last login and filters membership and inactivity", () => {
    const notes = [
      note({
        id: "quiet",
        name: "Quiet",
        last_seen_at: "2025-01-01T00:00:00Z",
        subscribed: false,
      }),
      note({
        id: "fresh",
        name: "Fresh",
        last_seen_at: "2026-10-05T00:00:00Z",
        subscribed: true,
      }),
    ];
    expect(sortLookNotes(notes, "inactive").map((row) => row.name)).toEqual(["Quiet", "Fresh"]);
    expect(sortLookNotes(notes, "active").map((row) => row.name)).toEqual(["Fresh", "Quiet"]);
    const now = Date.parse("2026-10-06T00:00:00Z");
    expect(
      notes
        .filter((row) => noteFitsLook(row, EMPTY_BROWSE_FILTERS, { audience: "subscribed", login: "any" }, now))
        .map((row) => row.name),
    ).toEqual(["Fresh"]);
    expect(
      notes
        .filter((row) => noteFitsLook(row, EMPTY_BROWSE_FILTERS, { audience: "unsubscribed", login: "inactive" }, now))
        .map((row) => row.name),
    ).toEqual(["Quiet"]);
  });
});
