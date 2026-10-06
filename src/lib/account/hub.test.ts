import { describe, expect, it } from "vitest";
import { ACCOUNT_GROUPS, accountInboxCounts } from "./hub";

describe("account hub", () => {
  it("keeps every section reachable from the rail", () => {
    expect(ACCOUNT_GROUPS.map((group) => group.id)).toEqual(["journey", "inbox", "privacy", "membership"]);
    const hrefs = ACCOUNT_GROUPS.flatMap((group) => group.items.map((item) => item.href));
    expect(hrefs).toContain("/app");
    expect(hrefs).toContain("/app/chat");
    expect(hrefs).toContain("/app/settings");
    expect(hrefs).toContain("/app/plans");
  });

  it("maps unread counts onto inbox cards", () => {
    expect(accountInboxCounts({ chatUnread: 2, alertUnread: 4, likesPending: 1 })["/app/alerts"]).toBe(4);
    expect(accountInboxCounts({ chatUnread: 2, alertUnread: 4, likesPending: 1 })["/app/interests"]).toBe(1);
  });
});
