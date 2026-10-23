import { describe, expect, it } from "vitest";
import { browseCardAlbum, isFeaturedBrowseCard, type BrowseCardNote } from "./browse-card";

function note(partial: Partial<BrowseCardNote> = {}): BrowseCardNote {
  return { id: "p1", href: "/browse/p1", name: "Jayesh", ...partial };
}

describe("browseCardAlbum", () => {
  it("uses up to three unique photos and falls back to the cover", () => {
    expect(browseCardAlbum(note({ photoUrl: "a.jpg" }))).toEqual(["a.jpg"]);
    expect(browseCardAlbum(note({ photoUrl: "a.jpg", photoUrls: ["a.jpg", "b.jpg", "c.jpg", "d.jpg"] }))).toEqual([
      "a.jpg",
      "b.jpg",
      "c.jpg",
    ]);
  });
});

describe("isFeaturedBrowseCard", () => {
  it("is a visual boost only for paid, complete, or strong matches", () => {
    expect(isFeaturedBrowseCard(note())).toBe(false);
    expect(isFeaturedBrowseCard(note({ subscribed: true }))).toBe(true);
    expect(isFeaturedBrowseCard(note({ complete: true }))).toBe(true);
    expect(isFeaturedBrowseCard(note({ matchPercent: 80 }))).toBe(true);
    expect(isFeaturedBrowseCard(note({ matchPercent: 79 }))).toBe(false);
    expect(
      isFeaturedBrowseCard(
        note({
          subscribed: true,
          staff: {
            memberCode: "SL-1",
            completePct: 90,
            filled: 16,
            total: 18,
            ready: true,
            nextGap: null,
            cover: "Gold",
            income: null,
          },
        }),
      ),
    ).toBe(false);
  });
});
