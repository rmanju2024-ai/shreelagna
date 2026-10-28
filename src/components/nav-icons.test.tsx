// @vitest-environment jsdom

import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { NavGlyph } from "./nav-icons";

function pathOf(name: string) {
  const { container } = render(<NavGlyph name={name} />);
  const svg = container.querySelector("svg");
  expect(svg?.getAttribute("fill")).toBe("currentColor");
  expect(svg?.getAttribute("stroke")).toBe("none");
  return svg?.innerHTML ?? "";
}

describe("solid nav icons", () => {
  it("uses a filled house, search, envelope, person and menu — not compass, grid or dots", () => {
    const home = pathOf("home");
    const discover = pathOf("browse");
    const inbox = pathOf("inbox");
    const account = pathOf("account");
    const more = pathOf("more");

    expect(home).toContain("L12 3");
    expect(discover).toContain("fill-rule");
    expect(inbox).toContain("l8 5");
    expect(account).toContain("4.2");
    expect(more).toContain("h18v2.4");

    expect(discover).not.toContain("M12 2");
    expect(account).not.toContain("h4v4");
    expect(more).not.toMatch(/circle cx="6"|circle cx="12".*circle cx="18"/);
  });
});
