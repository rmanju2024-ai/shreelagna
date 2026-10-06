// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { InstallAppMenuItem, InstallAppRoot } from "./install-app";

afterEach(cleanup);

beforeEach(() => {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  });
});

describe("Install app", () => {
  it("offers install from the menu and shows home-screen steps", () => {
    render(
      <InstallAppRoot>
        <InstallAppMenuItem />
      </InstallAppRoot>,
    );
    fireEvent.click(screen.getByRole("menuitem", { name: /install app/i }));
    expect(screen.getByRole("dialog", { name: /add to home screen/i })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /got it/i }));
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
