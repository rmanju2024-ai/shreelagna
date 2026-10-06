// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { InboxSwitcher } from "./inbox-switcher";

afterEach(cleanup);

describe("InboxSwitcher", () => {
  it("keeps a way back to Account hub above Chat, Interests and Alerts", () => {
    render(<InboxSwitcher active="chats" />);
    expect(screen.getByRole("link", { name: /back to account/i }).getAttribute("href")).toBe("/app/account");
    expect(screen.getByRole("link", { name: /chats/i }).getAttribute("href")).toBe("/app/chat");
    expect(screen.getByRole("link", { name: /likes/i }).getAttribute("href")).toBe("/app/interests");
    expect(screen.getByRole("link", { name: /alerts/i }).getAttribute("href")).toBe("/app/alerts");
  });
});
