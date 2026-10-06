// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { InboxSwitcherNav } from "./inbox-switcher";

afterEach(cleanup);

describe("InboxSwitcher", () => {
  it("keeps a way back to Account hub above Chat, Interests and Alerts", () => {
    render(<InboxSwitcherNav active="chats" />);
    expect(screen.getByRole("link", { name: /back to account/i }).getAttribute("href")).toBe("/app/account");
    expect(screen.getByRole("link", { name: /chats/i }).getAttribute("href")).toBe("/app/chat");
    expect(screen.getByRole("link", { name: /likes/i }).getAttribute("href")).toBe("/app/interests");
    expect(screen.getByRole("link", { name: /alerts/i }).getAttribute("href")).toBe("/app/alerts");
  });

  it("shows unread counts on the matching inbox tab", () => {
    render(<InboxSwitcherNav active="alerts" counts={{ chatUnread: 0, likesPending: 0, alertUnread: 2 }} />);
    expect(screen.getByRole("link", { name: /alerts/i }).textContent).toContain("2");
    expect(screen.getByRole("link", { name: /chats/i }).textContent).not.toContain("2");
  });
});
