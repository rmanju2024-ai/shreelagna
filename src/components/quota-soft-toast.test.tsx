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
      title: "Welcome gift",
      who: "Jayesh",
      body: "Welcome gift · Jayesh · Expires 4 Dec 2026",
      points: ["Expires 4 Dec 2026", "3 of 20 families used", "5 new families a day"],
      holdMs: 1000,
    });

    const dialog = await screen.findByRole("dialog", { name: "Welcome gift" });
    expect(dialog.className).toContain("quota-soft");
    expect(dialog.parentElement?.className).toContain("quota-soft-layer");
    expect(dialog.parentElement?.className).toContain("is-on");
    expect(dialog.querySelector(".quota-soft-brand .site-name")).toBeTruthy();
    expect(dialog.querySelector(".quota-soft-brand .site-name-word.is-connect")?.textContent).toBe("Connect");
    expect(dialog.textContent).toContain("Your plan");
    expect(screen.getByText("Jayesh").className).toContain("quota-soft-who");
    expect(screen.getByText("3 of 20 families used").closest("ul")?.className).toContain("quota-soft-points");
    expect(screen.getByRole("link", { name: "View plan" }).getAttribute("href")).toBe("/app/plans");
  });

  it("closes from the centre card", async () => {
    render(<QuotaSoftHost />);
    emitQuotaSoft({
      kind: "warn",
      title: "Welcome gift",
      who: "Jayesh",
      body: "Five families remain.",
      points: ["Five families remain."],
      holdMs: 1000,
    });
    fireEvent.click(await screen.findByRole("button", { name: "Close" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });
});
