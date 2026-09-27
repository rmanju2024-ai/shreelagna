import { BreakdownCard, Stat } from "@/app/desk/analytics/breakdown-card";
import { requireDesk } from "@/lib/desk/access";
import { placeBreakdown } from "@/lib/desk/breakdown";
import { fetchPulseProfiles } from "@/lib/desk/pulse-profiles";
import { createServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AnalyticsPlacePage() {
  const desk = await requireDesk("/desk/analytics/place");
  if (!desk.allowed) return null;
  const db = createServiceClient() ?? desk.supabase;
  const place = placeBreakdown(await fetchPulseProfiles(db));

  return (
    <>
      <div className="desk-stats">
        <Stat label="India" value={place.indiaCount} />
        <Stat label="Outside India" value={place.abroadCount} />
      </div>
      <div className="desk-break-grid">
        <BreakdownCard title="Region" rows={place.region} />
        <BreakdownCard title="India — state" rows={place.states} />
        <BreakdownCard title="Top cities" rows={place.cities} />
        <BreakdownCard title="Outside India" rows={place.abroad} />
      </div>
    </>
  );
}
