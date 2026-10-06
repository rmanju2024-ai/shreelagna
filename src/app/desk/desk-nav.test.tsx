// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DeskNav } from "./desk-nav";

const path = vi.fn(() => "/desk");

vi.mock("next/navigation", () => ({
  usePathname: () => path(),
}));

afterEach(() => {
  cleanup();
  path.mockReturnValue("/desk");
});

describe("Desk menu", () => {
  it("opens as a decorative hub on /desk", () => {
    render(<DeskNav admin={false} />);
    expect(screen.getByRole("navigation", { name: "House desk" }).className).toContain("is-hub");
    expect(screen.getByRole("link", { name: /Look/i }).getAttribute("href")).toBe("/desk/look");
    expect(screen.queryByRole("link", { name: /Verification/i })).toBeNull();
  });

  it("shows a compact rail on a desk page", () => {
    path.mockReturnValue("/desk/look");
    render(<DeskNav admin />);
    const nav = screen.getByRole("navigation", { name: "House desk" });
    expect(nav.className).toContain("is-rail");
    expect(screen.getByRole("link", { name: "All desks" }).getAttribute("href")).toBe("/desk");
    expect(screen.getByRole("link", { name: "Look" }).getAttribute("aria-current")).toBe("page");
  });
});
