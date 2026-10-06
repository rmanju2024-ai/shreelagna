import { describe, expect, it } from "vitest";
import { upsertShortlistNotice } from "./shortlist-notice";

describe("shortlist notice", () => {
  it("inserts one alert for the profile owner", async () => {
    const inserted: Record<string, unknown>[] = [];
    const db = {
      from() {
        return {
          select() {
            return {
              eq() {
                return {
                  eq() {
                    return {
                      eq() {
                        return {
                          order() {
                            return {
                              limit() {
                                return {
                                  async maybeSingle() {
                                    return { data: null };
                                  },
                                };
                              },
                            };
                          },
                        };
                      },
                    };
                  },
                };
              },
            };
          },
          async insert(row: Record<string, unknown>) {
            inserted.push(row);
          },
          update() {
            return { eq: async () => ({}) };
          },
        };
      },
    };
    await upsertShortlistNotice(db, {
      ownerUserId: "owner-1",
      viewerProfileId: "viewer-1",
      viewerName: "Rohan",
    });
    expect(inserted).toEqual([
      {
        user_id: "owner-1",
        kind: "shortlist",
        title: "Rohan",
        body: "Rohan shortlisted your profile.",
        href: "/browse/viewer-1",
        match_profile_id: "viewer-1",
      },
    ]);
  });
});
