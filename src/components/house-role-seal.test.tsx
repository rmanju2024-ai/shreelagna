// @vitest-environment jsdom

import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { HouseRoleSeal } from "./house-role-seal";

describe("HouseRoleSeal", () => {
  it("marks admin, staff and member", () => {
    const { rerender, container } = render(<HouseRoleSeal mark="admin" />);
    expect(container.firstElementChild?.className).toContain("is-admin");
    rerender(<HouseRoleSeal mark="staff" />);
    expect(container.firstElementChild?.className).toContain("is-staff");
    rerender(<HouseRoleSeal mark="member" />);
    expect(container.firstElementChild?.className).toContain("is-member");
    expect(container.querySelector(".house-star")).toBeTruthy();
  });
});
