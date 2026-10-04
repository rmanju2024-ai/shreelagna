// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HeaderNav } from "./site-nav";

vi.mock("next/navigation", () => ({
  usePathname: () => "/browse",
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/components/sign-out-button", () => ({
  SignOutButton: ({ className }: { className?: string }) => (
    <button type="button" className={className}>
      Sign out
    </button>
  ),
}));

afterEach(cleanup);

beforeEach(() => {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: query.includes("max-width: 820px"),
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
});

describe("mobile primary navigation", () => {
  it("portals every More option into a mobile sheet", () => {
    render(<HeaderNav overlay={false} user staff chatUnread={2} alertUnread={3} likesPending={1} />);

    fireEvent.click(screen.getByRole("button", { name: /more/i }));

    const menu = screen.getByRole("menu");
    expect(menu.parentElement).toBe(document.body);
    expect(menu.className).toContain("is-mobile-sheet");
    for (const label of ["About", "Help", "Account", "Sign out"]) {
      expect(screen.getByText(label)).toBeTruthy();
    }
  });

  it("closes the More sheet with Escape or an outside tap", () => {
    render(<HeaderNav overlay={false} user staff={false} />);
    const more = screen.getByRole("button", { name: /more/i });

    fireEvent.click(more);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("menu")).toBeNull();

    fireEvent.click(more);
    fireEvent.mouseDown(document.body);
    expect(screen.queryByRole("menu")).toBeNull();
  });

  it("keeps every member destination available (Likes and Alerts live inside Inbox)", () => {
    render(<HeaderNav overlay={false} user staff />);
    const nav = screen.getByRole("navigation", { name: "Primary" });
    for (const label of ["Home", "Discover", "Inbox", "Profile", "Desk", "More"]) {
      expect(nav.textContent).toContain(label);
    }
  });
});
