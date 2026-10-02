// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SCENE_OPTIONS } from "@/lib/ui/scenes";
import { ThemeQuickPicker } from "./theme-quick-picker";

afterEach(() => {
  cleanup();
  document.documentElement.removeAttribute("data-scene");
});

describe("ThemeQuickPicker", () => {
  it("offers every theme and applies a choice immediately", () => {
    const changed = vi.fn();
    window.addEventListener("sl-scene", changed, { once: true });

    render(<ThemeQuickPicker initial="wedding" />);
    fireEvent.click(screen.getByRole("button", { name: "Choose website theme" }));

    for (const option of SCENE_OPTIONS) {
      expect(screen.getByRole("menuitemradio", { name: new RegExp(option.label) })).toBeTruthy();
    }

    fireEvent.click(screen.getByRole("menuitemradio", { name: /Open nature/i }));

    expect(document.documentElement.dataset.scene).toBe("nature");
    expect(document.cookie).toContain("sl_scene=nature");
    expect(changed).toHaveBeenCalledOnce();
    expect(screen.queryByRole("menu")).toBeNull();
  });
});
