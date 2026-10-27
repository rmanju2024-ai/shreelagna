import { describe, expect, it } from "vitest";
import { noticeProfileListed, recordCollapsibleNotice } from "./house-notice";

describe("house notice", () => {
  it("lists profiles that are still in the house, including pending review", () => {
    expect(noticeProfileListed("active")).toBe(true);
    expect(noticeProfileListed("pending_review")).toBe(true);
    expect(noticeProfileListed("draft")).toBe(true);
    expect(noticeProfileListed("banned")).toBe(false);
  });

  it("inserts once, then updates the same topic instead of creating another", async () => {
    const inserted: Record<string, unknown>[] = [];
    let existing: { id: string } | null = null;
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
                                    return { data: existing };
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
            existing = { id: "n1" };
          },
          update() {
            return { eq: async () => ({}) };
          },
        };
      },
    };
    const payload = {
      userId: "owner-1",
      kind: "profile_view",
      title: "Soundary",
      body: "Soundary viewed your profile.",
      href: "/browse/v1",
      matchProfileId: "v1",
    };
    expect(await recordCollapsibleNotice(db, payload)).toEqual({ created: true });
    expect(await recordCollapsibleNotice(db, payload)).toEqual({ created: false });
    expect(inserted).toHaveLength(1);
  });
});
