import { describe, expect, it } from "vitest";
import { loadBrowsePhotoMap } from "./browse-query";

function mediaDb(rows: Record<string, { path: string; primary?: boolean }[]>) {
  return {
    from: () => ({
      select: () => ({
        eq: (_col: string, value: string | boolean) => {
          if (value === "photo" || value === true) {
            return {
              eq: () => ({
                in: (_c: string, ids: string[]) =>
                  Promise.resolve({
                    data: ids.flatMap((id) =>
                      (rows[id] ?? [])
                        .filter((row) => row.primary)
                        .map((row) => ({ profile_id: id, storage_path: row.path, is_primary: true })),
                    ),
                    error: null,
                  }),
              }),
              in: (_c: string, ids: string[]) => {
                const data = ids.flatMap((id) =>
                  (rows[id] ?? []).map((row) => ({
                    profile_id: id,
                    storage_path: row.path,
                    is_primary: Boolean(row.primary),
                  })),
                );
                const result = Promise.resolve({ data, error: null });
                return Object.assign(result, {
                  order: () => Promise.resolve({ data, error: null }),
                });
              },
            };
          }
          return {
            eq: () => ({ in: () => Promise.resolve({ data: [], error: null }) }),
            in: () => Promise.resolve({ data: [], error: null }),
          };
        },
      }),
    }),
  };
}

describe("loadBrowsePhotoMap", () => {
  it("uses primary photos and fills missing from the rest", async () => {
    const map = await loadBrowsePhotoMap(
      mediaDb({
        a: [{ path: "a1.jpg" }, { path: "a2.jpg", primary: true }],
        b: [{ path: "b1.jpg" }],
      }),
      ["a", "b"],
    );
    expect(map.get("a")).toBe("a2.jpg");
    expect(map.get("b")).toBe("b1.jpg");
  });
});
