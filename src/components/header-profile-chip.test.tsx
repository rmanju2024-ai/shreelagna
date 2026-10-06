// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { HeaderProfileChip } from "./header-profile-chip";

describe("HeaderProfileChip", () => {
  it("combines role and named profile", () => {
    render(<HeaderProfileChip name="Ananya Rao" pending={false} mark="member" />);
    const link = screen.getByRole("link", { name: /Member, Ananya Rao/ });
    expect(link.getAttribute("href")).toBe("/app");
    expect(link.className).toContain("is-member");
    expect(link.querySelector(".house-star")).toBeTruthy();
    expect(link.textContent).toContain("Ananya Rao");
  });

  it("keeps a long profile name in full", () => {
    render(<HeaderProfileChip name="Manjunatha Ramamurthy" pending={false} mark="staff" />);
    expect(screen.getByRole("link", { name: /Staff, Manjunatha Ramamurthy/ }).textContent).toContain(
      "Manjunatha Ramamurthy",
    );
  });

  it("keeps admin mark when a profile is missing", () => {
    render(<HeaderProfileChip name="Not created yet" pending mark="admin" />);
    const link = screen.getByRole("link", { name: /Admin, Not created yet/ });
    expect(link.getAttribute("href")).toBe("/app/profiles/new");
    expect(link.className).toContain("is-admin");
  });
});
