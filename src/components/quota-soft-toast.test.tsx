// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { emitQuotaSoft, QuotaSoftHost } from "./quota-soft-toast";

afterEach(cleanup);

describe("plan status popup", () => {
  it("opens in the centre of the page with the house logo", async () => {
    render(<QuotaSoftHost />);
    emitQuotaSoft({
      kind: "status",
      title: "Dear Jayesh,",
      body: "You are on the Welcome gift plan.",
      holdMs: 1000,
    });

    const dialog = await screen.findByRole("dialog", { name: "Dear Jayesh," });
    expect(dialog.className).toContain("quota-soft");
    expect(dialog.parentElement?.className).toContain("quota-soft-layer");
    expect(dialog.parentElement?.className).toContain("is-on");
    expect(dialog.textContent).toContain("Marriage");
    expect(dialog.textContent).toContain("Connect");
    expect(dialog.textContent).toContain("Your plan");
    expect(screen.getByRole("link", { name: "View plan" }).getAttribute("href")).toBe("/app/plans");
  });

  it("closes from the centre card", async () => {
    render(<QuotaSoftHost />);
    emitQuotaSoft({
      kind: "warn",
      title: "Dear Jayesh,",
      body: "Five families remain.",
      holdMs: 1000,
    });
    fireEvent.click(await screen.findByRole("button", { name: "Close" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });
});
