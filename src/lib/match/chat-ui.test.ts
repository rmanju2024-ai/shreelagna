import { describe, expect, it } from "vitest";
import { chatStamp, countByKey, latestByThread, previewText, unreadLabel } from "./chat-ui";

describe("chat ui", () => {
  it("stamps today as time and older as date", () => {
    const now = Date.parse("2026-09-24T18:30:00+05:30");
    expect(chatStamp("2026-09-24T18:19:25+05:30", now)).toBe("6:19 pm");
    expect(chatStamp("2026-09-23T18:19:25+05:30", now)).toBe("Yesterday");
    expect(chatStamp("2026-09-10T18:19:25+05:30", now)).toBe("10 Sep");
  });

  it("keeps the newest message per thread", () => {
    const map = latestByThread([
      { thread_id: "a", created_at: "2026-09-24T10:00:00Z", body: "old" },
      { thread_id: "a", created_at: "2026-09-24T12:00:00Z", body: "new" },
      { thread_id: "b", created_at: "2026-09-24T11:00:00Z", body: "b" },
    ]);
    expect(map.get("a")?.body).toBe("new");
    expect(map.get("b")?.body).toBe("b");
  });

  it("prints unread badges", () => {
    expect(unreadLabel(0)).toBe("");
    expect(unreadLabel(3)).toBe("3");
    expect(unreadLabel(120)).toBe("99+");
    expect(countByKey(["/app/chat/a", "/app/chat/a", "/app/chat/b"]).get("/app/chat/a")).toBe(2);
  });

  it("shortens preview text", () => {
    expect(previewText("")).toBe("Tap to chat");
    expect(previewText("Hi")).toBe("Hi");
    expect(previewText("x".repeat(50)).endsWith("…")).toBe(true);
  });
});
