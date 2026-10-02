import { BreakdownCard, Stat } from "@/app/desk/analytics/breakdown-card";
import { requireDesk } from "@/lib/desk/access";
import { cachedPulseMedia, cachedPulseProfiles, cachedWeekPresence } from "@/lib/desk/cached";
import { healthBreakdown, tallyWeekPresence } from "@/lib/desk/breakdown";
import { fetchPulseMedia, fetchPulseProfiles, fetchWeekPresence } from "@/lib/desk/pulse-profiles";
import { createServiceClient } from "@/lib/supabase/server";
import { istDayKey, istWeekStartKey } from "@/lib/time/ist";

export default async function AnalyticsHealthPage() {
  const desk = await requireDesk("/desk/analytics/health");
  if (!desk.allowed) return null;
  const db = createServiceClient() ?? desk.supabase;
  const now = new Date();
  const [profiles, media, visits] = await Promise.all([
    cachedPulseProfiles().catch(() => fetchPulseProfiles(db)),
    cachedPulseMedia().catch(() => fetchPulseMedia(db)),
    cachedWeekPresence().catch(() => fetchWeekPresence(db, istWeekStartKey(now), istDayKey(now))),
  ]);
  const health = healthBreakdown(profiles, media);
  const week = tallyWeekPresence(visits, 4);

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
    </>
  );
}
