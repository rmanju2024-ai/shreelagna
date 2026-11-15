// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DeskNav } from "./desk-nav";

const path = vi.fn(() => "/desk/tickets");

vi.mock("next/navigation", () => ({
  usePathname: () => path(),
}));

afterEach(() => {
  cleanup();
  path.mockReturnValue("/desk/tickets");
});

describe("Desk menu", () => {
  it("hides Verify from staff and shows it to admin", () => {
    const { rerender } = render(<DeskNav admin={false} />);
    expect(screen.queryByRole("link", { name: "Verify" })).toBeNull();
    rerender(<DeskNav admin />);
    expect(screen.getByRole("link", { name: "Verify" }).getAttribute("href")).toBe("/desk/verification");
  });

  it("stays a compact rail and highlights Tickets on the default desk", () => {
    render(<DeskNav admin={false} />);
    const nav = screen.getByRole("navigation", { name: "House desk" });
    expect(nav.className).toContain("is-rail");
    expect(nav.className).not.toContain("is-hub");
    expect(screen.getByRole("link", { name: "Tickets" }).getAttribute("aria-current")).toBe("page");
    expect(screen.getByRole("link", { name: "Browse" }).getAttribute("href")).toBe("/desk/look");
  });

  it("highlights the open desk on another page", () => {
    path.mockReturnValue("/desk/look");
    render(<DeskNav admin />);
    expect(screen.getByRole("navigation", { name: "House desk" }).className).toContain("is-rail");
    expect(screen.getByRole("link", { name: "Browse" }).getAttribute("aria-current")).toBe("page");
    expect(screen.getByRole("link", { name: "Tickets" }).getAttribute("aria-current")).toBeNull();
  });
});
