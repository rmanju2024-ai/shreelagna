import { BreakdownCard, Stat } from "@/app/desk/analytics/breakdown-card";
import { requireDesk } from "@/lib/desk/access";
import { healthBreakdown, tallyWeekPresence } from "@/lib/desk/breakdown";
import { fetchPulseMedia, fetchPulseProfiles, fetchWeekPresence } from "@/lib/desk/pulse-profiles";
import { createServiceClient } from "@/lib/supabase/server";
import { istDayKey, istWeekStartKey } from "@/lib/time/ist";
import { cardClass } from "@/lib/ui/classes";

export const dynamic = "force-dynamic";

export default async function AnalyticsHealthPage() {
  const desk = await requireDesk("/desk/analytics/health");
  if (!desk.allowed) return null;
  const db = createServiceClient() ?? desk.supabase;
  const now = new Date();
  const [profiles, media, visits] = await Promise.all([
    fetchPulseProfiles(db),
    fetchPulseMedia(db),
    fetchWeekPresence(db, istWeekStartKey(now), istDayKey(now)),
  ]);
  const health = healthBreakdown(profiles, media);
  const week = tallyWeekPresence(visits, 4);
  const activeIds = week.active.map((row) => row.userId);
  const people = activeIds.length
    ? ((await db.from("app_users").select("id, display_name, email").in("id", activeIds.slice(0, 40))).data ?? [])
    : [];
  const daysByUser = new Map(week.active.map((row) => [row.userId, row.days]));

  return (
    <>
      <div className="desk-stats">
        <Stat label="Completed" value={health.completed} />
        <Stat label="Uncompleted" value={health.uncompleted} />
        <Stat label="On 4+ days this week" value={week.activeCount} />
        <Stat label="Quiet ≥ 1 week" value={health.inactiveWeek} />
        <Stat label="Quiet ≥ 2 weeks" value={health.inactive2Weeks} />
        <Stat label="Quiet ≥ 4 weeks" value={health.inactive4Weeks} />
        <Stat label="Quiet ≥ 3 months" value={health.inactive3Months} />
        <Stat label="Quiet ≥ 6 months" value={health.inactive6Months} />
      </div>
      <div className="desk-break-grid">
        <BreakdownCard title="Days on site this week" rows={week.bands} />
        <BreakdownCard title="Quiet since" rows={health.idle} />
        <BreakdownCard title="Photo, video, voice" rows={health.media} />
        <BreakdownCard title="Profile status" rows={health.status} />
      </div>
      <div className="desk-admin-block">
        <p className="browse-kicker">Most active</p>
        <h3>Logged in more than 3 days this week</h3>
        <ul className="desk-staff-list">
          {people.map((row) => (
            <li key={row.id} className={`${cardClass} card-3d`}>
              <p className="desk-ticket-name">
                {row.display_name || row.email}
                <span> · {daysByUser.get(row.id) ?? 0} days</span>
              </p>
              <p className="desk-ticket-meta">{row.email}</p>
            </li>
          ))}
        </ul>
        {!people.length ? (
          <p className="desk-empty">Nobody has four IST days on site yet this week. Counts start after you apply presence_days SQL and members visit.</p>
        ) : null}
      </div>
    </>
  );
}
