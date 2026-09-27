import { describe, expect, it } from "vitest";
import { uniqueCommunities } from "./communities";

const hindu = "rel-hindu";

describe("uniqueCommunities", () => {
  it("keeps one Iyengar and prefers Brahmin - Iyer over Iyer", () => {
    const rows = uniqueCommunities([
      { id: "1", religion_id: hindu, name: "Iyengar" },
      { id: "2", religion_id: hindu, name: "Iyengar" },
      { id: "3", religion_id: hindu, name: "Iyer" },
      { id: "4", religion_id: hindu, name: "Brahmin - Iyer" },
    ]);
    expect(rows.map((r) => r.name)).toEqual(["Brahmin - Iyer", "Iyengar"]);
  });

  it("does not merge Jat across religions", () => {
    const rows = uniqueCommunities([
      { id: "1", religion_id: "h", name: "Jat" },
      { id: "2", religion_id: "s", name: "Jat" },
    ]);
    expect(rows).toHaveLength(2);
  });
});
