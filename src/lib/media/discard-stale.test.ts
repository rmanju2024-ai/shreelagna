import { describe, expect, it } from "vitest";
import { staleMediaRows } from "./discard-stale";

describe("discard stale profile media", () => {
  it("keeps only the new file and drops previous video, voice, or photo rows", () => {
    expect(
      staleMediaRows(
        [
          { id: "old-video", storage_path: "a/old.mp4" },
          { id: "new-video", storage_path: "a/new.mp4" },
          { id: "empty", storage_path: "" },
        ],
        ["new-video"],
      ).map((row) => row.id),
    ).toEqual(["old-video"]);
  });
});
