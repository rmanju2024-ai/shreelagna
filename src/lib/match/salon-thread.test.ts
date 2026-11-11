import { describe, expect, it } from "vitest";
import {
  buildSalonRows,
  chatDayLabel,
  chatPresenceLine,
  firstUnreadIndex,
  messageMatchesQuery,
} from "./salon-thread";

const base = {
  body: "Hello",
  created_at: "2026-11-09T10:00:00.000Z",
};

describe("salon thread layout", () => {
  it("groups consecutive notes from the same person and labels You", () => {
    const rows = buildSalonRows(
      [
        { id: "1", sender_profile_id: "me", ...base },
        { id: "2", sender_profile_id: "me", body: "Again", created_at: "2026-11-09T10:02:00.000Z" },
        { id: "3", sender_profile_id: "them", body: "Hi", created_at: "2026-11-09T10:10:00.000Z" },
      ],
      "me",
      "Priya",
    );
    const notes = rows.filter((row) => row.kind === "msg");
    expect(notes[0]?.showName).toBe(true);
    expect(notes[1]?.tight).toBe(true);
    expect(notes[1]?.showName).toBe(false);
    expect(notes[2]?.showName).toBe(true);
    expect(notes[0]?.showTime).toBe(false);
    expect(notes[1]?.showTime).toBe(true);
    expect(rows.filter((row) => row.kind === "day")).toHaveLength(1);
  });

  it("does not repeat a day heading, and skips Today", () => {
    const now = Date.parse("2026-11-11T12:00:00.000Z");
    const today = buildSalonRows(
      [
        { id: "1", sender_profile_id: "me", body: "A", created_at: "2026-11-11T08:00:00.000Z" },
        { id: "2", sender_profile_id: "me", body: "B", created_at: "2026-11-11T08:01:00.000Z" },
      ],
      "me",
      "Priya",
      now,
    );
    expect(today.filter((row) => row.kind === "day")).toHaveLength(0);

    const older = buildSalonRows(
      [
        { id: "1", sender_profile_id: "me", body: "A", created_at: "2026-11-09T10:00:00.000Z" },
        { id: "2", sender_profile_id: "them", body: "B", created_at: "2026-11-09T12:00:00.000Z" },
        { id: "3", sender_profile_id: "me", body: "C", created_at: "2026-11-10T10:00:00.000Z" },
      ],
      "me",
      "Priya",
      now,
    );
    expect(older.filter((row) => row.kind === "day").map((row) => (row.kind === "day" ? row.label : ""))).toEqual([
      chatDayLabel("2026-11-09T10:00:00.000Z", now),
      chatDayLabel("2026-11-10T10:00:00.000Z", now),
    ]);
  });

  it("marks Seen only on the last sent note that was read", () => {
    const rows = buildSalonRows(
      [
        { id: "1", sender_profile_id: "me", body: "A", created_at: "2026-11-09T10:00:00.000Z", read_at: "x" },
        { id: "2", sender_profile_id: "me", body: "B", created_at: "2026-11-09T10:01:00.000Z", read_at: "y" },
      ],
      "me",
      "Priya",
    );
    const notes = rows.filter((row) => row.kind === "msg");
    expect(notes[0]?.showSeen).toBe(false);
    expect(notes[1]?.showSeen).toBe(true);
  });

  it("inserts a new-messages break before the first unread incoming note", () => {
    const messages = [
      { id: "1", sender_profile_id: "me", ...base, read_at: "x" },
      { id: "2", sender_profile_id: "them", body: "New", created_at: "2026-11-09T11:00:00.000Z" },
    ];
    expect(firstUnreadIndex(messages, "me")).toBe(1);
    expect(buildSalonRows(messages, "me", "Priya").some((row) => row.kind === "unread")).toBe(true);
  });

  it("filters search, presence, and day labels", () => {
    expect(messageMatchesQuery("Will you marry me", "marry")).toBe(true);
    expect(messageMatchesQuery("Hello", "xyz")).toBe(false);
    expect(chatPresenceLine(true, null)).toBe("Online now");
    expect(chatPresenceLine(false, "2026-11-11T16:10:00+05:30", Date.parse("2026-11-11T18:00:00+05:30"))).toMatch(
      /Last seen today,/,
    );
    expect(chatDayLabel("2026-11-09T10:00:00.000Z", Date.parse("2026-11-11T00:00:00Z"))).toMatch(/November/);
  });
});
