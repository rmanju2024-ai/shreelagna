// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HeaderNav } from "./site-nav";
import { InstallAppRoot } from "./install-app";

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
    render(
      <InstallAppRoot>
        <HeaderNav overlay={false} user staff chatUnread={2} alertUnread={3} likesPending={1} />
      </InstallAppRoot>,
    );

    fireEvent.click(screen.getByRole("button", { name: /more/i }));

    const menu = screen.getByRole("menu");
    expect(menu.parentElement).toBe(document.body);
    expect(menu.className).toContain("is-mobile-sheet");
    expect(menu.style.position).toBe("fixed");
    for (const label of ["About", "Help", "Install app", "Sign out"]) {
      expect(screen.getByText(label)).toBeTruthy();
    }
    expect(menu.textContent).not.toContain("AccountHub");
    expect(menu.textContent).not.toContain("Account");
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

  it("keeps every member destination available (Inbox lives on Account hub)", () => {
    render(<HeaderNav overlay={false} user staff />);
    const nav = screen.getByRole("navigation", { name: "Primary" });
    for (const label of ["Home", "Discover", "Account", "Desk", "More"]) {
      expect(nav.textContent).toContain(label);
    }
    expect(nav.textContent).not.toContain("Inbox");
  });
});
