import { describe, expect, it } from "vitest";
import { tallyProfiles, tallyTickets } from "./stats";

describe("desk analytics", () => {
  it("counts profiles by type and status", () => {
    expect(
      tallyProfiles([
        { profile_type: "vadhu", status: "active" },
        { profile_type: "vara", status: "hidden" },
        { profile_type: "vara", status: "active" },
      ]),
    ).toEqual({ profiles: 3, vadhu: 1, vara: 2, active: 2, hidden: 1 });
  });

  it("counts tickets by status", () => {
    expect(
      tallyTickets([
        { status: "new" },
        { status: "new" },
        { status: "done" },
        { status: "in_progress" },
        { status: "on_hold" },
      ]),
    ).toEqual({
      ticketsNew: 2,
      ticketsBusy: 1,
      ticketsHold: 1,
      ticketsDone: 1,
    });
  });
});
