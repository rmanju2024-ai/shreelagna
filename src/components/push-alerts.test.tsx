// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { InstallAppRoot } from "./install-app";
import { PushAlertsControl } from "./push-alerts";

vi.mock("@/app/app/alerts/push-actions", () => ({
  getPushClientConfig: vi.fn(async () => ({ publicKey: "" })),
  savePushSubscription: vi.fn(async () => ({ ok: true })),
  dropPushSubscription: vi.fn(async () => ({ ok: true })),
}));

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

describe("Turn on alerts", () => {
  it("renders the enable control without crashing when Notification is missing", async () => {
    render(
      <InstallAppRoot>
        <PushAlertsControl />
      </InstallAppRoot>,
    );
    expect(screen.getByRole("region", { name: /device alerts/i })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /enable notifications/i }));
    expect((await screen.findAllByText(/push alerts are not set up/i)).length).toBeGreaterThan(0);
  });
});
