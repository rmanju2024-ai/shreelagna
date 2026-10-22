// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { PlanCatalogForm } from "./plan-catalog-form";

afterEach(cleanup);

describe("PlanCatalogForm", () => {
  it("shows a saved confirmation after a successful save", async () => {
    render(
      <PlanCatalogForm
        action={async () => ({ ok: true, name: "Gold", code: "gold" })}
        submitLabel="Save Gold"
        busyLabel="Saving…"
        savedLabel="Gold is saved"
      >
        <input name="name" defaultValue="Gold" />
      </PlanCatalogForm>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Save Gold" }));
    await waitFor(() => {
      expect(screen.getByText("Gold is saved")).toBeTruthy();
      expect(screen.getByRole("button", { name: "Saved" })).toBeTruthy();
    });
  });
});
