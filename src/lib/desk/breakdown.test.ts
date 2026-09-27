import { describe, expect, it } from "vitest";
import {
  ageBand,
  auditActionLabel,
  countBy,
  createdTrend,
  healthBreakdown,
  houseRoleLabel,
  idleBand,
  livingCountry,
  peopleBreakdown,
  placeBreakdown,
  planUsage,
  tallyWeekPresence,
  topCounts,
} from "./breakdown";

describe("desk breakdown", () => {
  it("groups empty values and sorts by count", () => {
    expect(countBy(["Karnataka", "Karnataka", "", "Goa"])).toEqual([
      { label: "Karnataka", count: 2 },
      { label: "Goa", count: 1 },
      { label: "Not shared", count: 1 },
    ]);
  });

  it("bands age the way the house asked", () => {
    expect(ageBand(18)).toBe("18-25");
    expect(ageBand(25)).toBe("18-25");
    expect(ageBand(26)).toBe("25-30");
    expect(ageBand(40)).toBe("35-40");
    expect(ageBand(41)).toBe("40+");
    expect(ageBand(null)).toBe("Not shared");
  });

  it("splits India and abroad, and people slices", () => {
    const rows = [
      {
        current_country: "India",
        current_state: "Karnataka",
        current_city: "Bengaluru",
        occupation: "Engineer",
        creator_relationship: "parent",
        marital_status: "never_married",
        income_band: "10-15 LPA",
        qualification: "B.E",
        date_of_birth: "1998-01-01",
      },
      {
        current_country: "United States",
        current_city: "Dallas",
        occupation: "Doctor",
        marital_status: "divorced",
        date_of_birth: "1980-06-01",
      },
    ];
    expect(livingCountry(rows[1])).toBe("United States");
    const place = placeBreakdown(rows);
    expect(place.indiaCount).toBe(1);
    expect(place.abroadCount).toBe(1);
    expect(place.states[0]?.label).toBe("Karnataka");
    const people = peopleBreakdown(rows, new Date("2026-09-25"));
    expect(people.age.map((row) => row.label)).toEqual(["25-30", "40+"]);
    expect(people.marital.find((row) => row.label === "Never married")?.count).toBe(1);
    expect(people.createdBy.find((row) => row.label === "Parent")?.count).toBe(1);
  });

  it("keeps only the busiest cities and rolls the rest into Other", () => {
    const rows = Array.from({ length: 20 }, (_, i) => ({
      label: `City ${i}`,
      count: 20 - i,
    })).concat([{ label: "City not shared", count: 3 }]);
    const top = topCounts(rows, 3, "City not shared");
    expect(top.map((row) => row.label)).toEqual(["City 0", "City 1", "City 2", "Other (17)", "City not shared"]);
    expect(top.find((row) => row.label.startsWith("Other"))?.count).toBe(rows.slice(3, 20).reduce((n, row) => n + row.count, 0));
  });

  it("bands quiet time and media health", () => {
    const now = new Date("2026-09-25T00:00:00Z");
    expect(idleBand(now.toISOString(), now)).toBe("Seen this week");
    expect(idleBand(new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString(), now)).toBe("Quiet 1–2 weeks");
    expect(idleBand(null, now)).toBe("Never seen");
    const health = healthBreakdown(
      [
        {
          id: "a",
          last_seen_at: new Date(now.getTime() - 40 * 24 * 60 * 60 * 1000).toISOString(),
          about: "x".repeat(90),
          subject_full_name: "Anita",
          surname: "Rao",
          date_of_birth: "1998-01-01",
          birth_time: "06:30",
          birth_city: "Bengaluru",
          current_city: "Bengaluru",
          current_country: "India",
          height_cm: 160,
          marital_status: "never_married",
          qualification: "B.E",
          occupation: "Engineer",
          subject_mobile: "9876543210",
          status: "active",
        },
      ],
      [{ profile_id: "a", kind: "photo", status: "approved" }, { profile_id: "a", kind: "video", status: "pending" }],
      now,
    );
    expect(health.inactive4Weeks).toBe(1);
    expect(health.video).toBe(1);
    expect(health.completed).toBe(1);
  });

  it("flags members on more than 3 days this week", () => {
    const week = tallyWeekPresence([
      { user_id: "a", day: "2026-09-21" },
      { user_id: "a", day: "2026-09-22" },
      { user_id: "a", day: "2026-09-23" },
      { user_id: "a", day: "2026-09-24" },
      { user_id: "b", day: "2026-09-21" },
      { user_id: "b", day: "2026-09-22" },
    ]);
    expect(week.activeCount).toBe(1);
    expect(week.active[0]?.userId).toBe("a");
    expect(week.bands.find((row) => row.label === "4 days")?.count).toBe(1);
  });

  it("counts new profiles by day and month", () => {
    const now = new Date("2026-09-25T12:00:00+05:30");
    const trend = createdTrend(
      [
        { created_at: "2026-09-25T06:00:00+05:30" },
        { created_at: "2026-09-25T18:00:00+05:30" },
        { created_at: "2026-09-20T10:00:00+05:30" },
        { created_at: "2026-08-01T10:00:00+05:30" },
      ],
      now,
    );
    expect(trend.today).toBe(2);
    expect(trend.lastWeek).toBe(3);
    expect(trend.daily).toHaveLength(7);
    expect(trend.daily.at(-1)?.count).toBe(2);
    expect(trend.monthly).toHaveLength(12);
    expect(trend.monthly.at(-1)?.label).toBe("Sep 2026");
  });

  it("counts paid plans, welcome gift, and no plan", () => {
    const now = new Date("2026-09-25T00:00:00Z");
    const usage = planUsage({
      memberCount: 10,
      welcomeWindowCount: 4,
      paidWelcomeOverlap: 1,
      paid: [
        { user_id: "a", plan_code: "gold", ends_at: "2027-01-01T00:00:00Z" },
        { user_id: "b", plan_code: "gold", ends_at: "2027-01-01T00:00:00Z" },
        { user_id: "c", plan_code: "silver", ends_at: "2020-01-01T00:00:00Z" },
      ],
      catalog: [
        { code: "silver", name: "Silver" },
        { code: "gold", name: "Gold" },
      ],
      now,
    });
    expect(usage.paidMembers).toBe(2);
    expect(usage.welcome).toBe(3);
    expect(usage.noPlan).toBe(5);
    expect(usage.rows).toEqual([
      { label: "Silver", count: 0 },
      { label: "Gold", count: 2 },
      { label: "Welcome gift", count: 3 },
      { label: "No plan", count: 5 },
    ]);
    expect(auditActionLabel("profile.translate")).toBe("Profile translated");
    expect(houseRoleLabel("service")).toBe("Staff");
  });
});
