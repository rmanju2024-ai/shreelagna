import { describe, expect, it } from "vitest";
import { parsePeopleSort, peopleSortSpec } from "./people-sort";

describe("people directory sort", () => {
  it("defaults to newest first", () => {
    expect(parsePeopleSort(undefined)).toBe("newest");
    expect(parsePeopleSort("weird")).toBe("newest");
    expect(peopleSortSpec("newest")).toMatchObject({ column: "created_at", ascending: false });
  });

  it("keeps each listed option", () => {
    expect(parsePeopleSort("name")).toBe("name");
    expect(peopleSortSpec("place")).toMatchObject({ column: "current_city", ascending: true });
    expect(peopleSortSpec("active")).toMatchObject({ column: "last_seen_at", ascending: false });
  });
});
