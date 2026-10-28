// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { NavigationFeedback } from "./navigation-feedback";

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));

afterEach(cleanup);

describe("NavigationFeedback", () => {
  it("does not cover the brand with a Loading chip while a link is opening", () => {
    render(
      <>
        <NavigationFeedback />
        <a href="/browse">Discover</a>
      </>,
    );

    const link = screen.getByRole("link", { name: "Discover" });
    link.addEventListener("click", (event) => event.preventDefault());
    fireEvent.click(link, { button: 0 });

    expect(screen.queryByText("Loading")).toBeNull();
    expect(screen.getByRole("status", { name: "Loading" }).className).toContain("is-loading");
  });
});
