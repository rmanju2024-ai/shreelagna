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
      matches: false,
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

describe("laptop primary navigation", () => {
  it("keeps the bar in the header, not as a phone dock", () => {
    const { container } = render(<HeaderNav overlay={false} user staff />);
    const nav = screen.getByRole("navigation", { name: "Primary" });
    expect(nav.className).not.toContain("is-mobile-dock");
    expect(nav.parentElement).not.toBe(document.body);
    expect(container.querySelector(".site-nav")).toBe(nav);
    expect(nav.getAttribute("style")).toBeNull();
  });

  it("lets a signed-in member reach Discover, Inbox and Account from the laptop bar", () => {
    render(<HeaderNav overlay={false} user staff={false} chatUnread={2} alertUnread={3} likesPending={1} />);
    const nav = screen.getByRole("navigation", { name: "Primary" });
    expect(screen.getByRole("link", { name: "Home" }).getAttribute("href")).toBe("/");
    expect(screen.getByRole("link", { name: "Discover" }).getAttribute("href")).toBe("/browse");
    expect(screen.getByRole("link", { name: /Inbox/ }).getAttribute("href")).toBe("/app/interests");
    expect(screen.getByRole("link", { name: "Account" }).getAttribute("href")).toBe("/app/account");
    expect(nav.textContent).toContain("6");
    expect(screen.queryByRole("link", { name: "Desk" })).toBeNull();
    expect(screen.queryByRole("link", { name: "Sign in" })).toBeNull();
  });

  it("shows Sign in instead of Inbox for a guest on a laptop", () => {
    render(<HeaderNav overlay={false} user={false} staff={false} />);
    expect(screen.getByRole("link", { name: "Sign in" }).getAttribute("href")).toBe("/login");
    expect(screen.queryByRole("link", { name: /Inbox/ })).toBeNull();
    expect(screen.queryByRole("link", { name: "Account" })).toBeNull();
  });

  it("opens More as a desktop flyout with About and Sign out", () => {
    render(
      <InstallAppRoot>
        <HeaderNav overlay={false} user staff />
      </InstallAppRoot>,
    );
    fireEvent.click(screen.getByRole("button", { name: /more/i }));
    const menu = screen.getByRole("menu");
    expect(menu.className).not.toContain("is-mobile-sheet");
    expect(screen.getByRole("menuitem", { name: "About & Help" }).getAttribute("href")).toBe("/about");
    expect(screen.getByRole("link", { name: "Desk" }).getAttribute("href")).toBe("/desk");
    expect(screen.getByText("Sign out")).toBeTruthy();
  });
});
