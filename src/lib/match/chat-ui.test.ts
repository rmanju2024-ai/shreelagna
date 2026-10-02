import { describe, expect, it } from "vitest";
import { countByKey, latestByThread, pickFirstChat, previewText, unreadLabel } from "./chat-ui";

describe("chat list helpers", () => {
  it("keeps the newest message per thread", () => {
    const map = latestByThread([
      { thread_id: "a", created_at: "2026-01-01T10:00:00Z", body: "old" },
      { thread_id: "a", created_at: "2026-01-02T10:00:00Z", body: "new" },
      { thread_id: "b", created_at: "2026-01-01T09:00:00Z", body: "other" },
    ]);
    expect(map.get("a")?.body).toBe("new");
    expect(map.size).toBe(2);
  });

  it("builds a short preview", () => {
    expect(previewText("")).toBe("Tap to chat");
    expect(previewText("  hello   world ")).toBe("hello world");
    expect(previewText("x".repeat(60)).endsWith("…")).toBe(true);
    expect(previewText("x".repeat(60)).length).toBe(42);
  });

  it("counts unread per chat link and caps the label", () => {
    const counts = countByKey(["/app/chat/1", "/app/chat/1", null, "/app/chat/2"]);
    expect(counts.get("/app/chat/1")).toBe(2);
    expect(counts.get("/app/chat/2")).toBe(1);
    expect(unreadLabel(0)).toBe("");
    expect(unreadLabel(7)).toBe("7");
    expect(unreadLabel(150)).toBe("99+");
  });

  it("opens the top active conversation", () => {
    const threads = [
      { id: "t1", profile_a: "me", profile_b: "gone" },
      { id: "t2", profile_a: "pal", profile_b: "me" },
      { id: "t3", profile_a: "me", profile_b: "other" },
    ];
    const others = new Map([
      ["gone", { status: "deleted" }],
      ["pal", { status: "active" }],
      ["other", { status: "active" }],
    ]);
    expect(pickFirstChat(threads, ["me"], others)?.id).toBe("t2");
    expect(pickFirstChat(threads, ["me"], new Map())).toBeNull();
    expect(pickFirstChat([], ["me"], others)).toBeNull();
  });
});
