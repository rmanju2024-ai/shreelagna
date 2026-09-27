import { describe, expect, it } from "vitest";
import { inboxLastOnline, inboxPhotoPath, pageCount, pageItems, pickPrimaryPhotoMap, PROFILE_PAGE_SIZE } from "./inbox-card";

describe("inbox cards", () => {
  it("pages 20 profiles at a time", () => {
    expect(PROFILE_PAGE_SIZE).toBe(20);
    expect(pageCount(0)).toBe(1);
    expect(pageCount(20)).toBe(1);
    expect(pageCount(21)).toBe(2);
    const rows = Array.from({ length: 43 }, (_, i) => i + 1);
    expect(pageItems(rows, 1)).toEqual(rows.slice(0, 20));
    expect(pageItems(rows, 3)).toEqual(rows.slice(40, 43));
    expect(pageItems(rows, 99)).toEqual(rows.slice(40, 43));
  });

  it("prints last seen in IST", () => {
    const now = Date.parse("2026-09-24T12:00:00Z");
    expect(inboxLastOnline(true, "2026-09-23T06:20:17Z", now)).toBe("Last online hidden");
    expect(inboxLastOnline(false, null, now)).toBe("Online —");
    expect(inboxLastOnline(false, "2026-09-24T11:58:00Z", now)).toBe("Online now");
    expect(inboxLastOnline(false, "2026-09-24T11:30:00Z", now)).toMatch(/Last seen today at/i);
    expect(inboxLastOnline(false, "2026-09-24T10:00:00Z", now)).toMatch(/3:30/i);
    expect(inboxLastOnline(false, "2026-09-23T12:00:00Z", now)).toMatch(/yesterday/i);
    expect(inboxLastOnline(false, "2026-09-10T12:00:00Z", now)).toMatch(/10 Sep/i);
    expect(inboxLastOnline(false, "2026-09-24T11:30:00Z", now, "hidden")).toBe("Profile is set Hidden");
    expect(inboxLastOnline(true, "2026-09-24T11:30:00Z", now, "hidden")).toBe("Profile is set Hidden");
    expect(inboxLastOnline(false, "2026-09-24T11:30:00Z", now, "deleted")).toBe("Profile is set Deleted");
    expect(inboxLastOnline(false, null, now, "banned")).toBe("Profile is set Deleted");
    expect(inboxPhotoPath({ path: "a.jpg" })).toBeNull();
    expect(inboxPhotoPath({ path: "a.jpg", accepted: true })).toBe("a.jpg");
    expect(inboxPhotoPath({ path: "a.jpg", hideUntilAccept: false })).toBe("a.jpg");
    expect(inboxPhotoPath({ path: "a.jpg", interestReceived: true })).toBe("a.jpg");
  });

  it("picks the primary photo per profile", () => {
    const map = pickPrimaryPhotoMap([
      { profile_id: "p1", storage_path: "old.jpg", is_primary: false },
      { profile_id: "p1", storage_path: "cover.jpg", is_primary: true },
      { profile_id: "p2", storage_path: "only.jpg" },
    ]);
    expect(map.get("p1")).toBe("cover.jpg");
    expect(map.get("p2")).toBe("only.jpg");
  });
});
