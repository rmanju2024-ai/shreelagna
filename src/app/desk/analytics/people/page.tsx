import { BreakdownCard } from "@/app/desk/analytics/breakdown-card";
import { requireDesk } from "@/lib/desk/access";
import { peopleBreakdown } from "@/lib/desk/breakdown";
import { fetchPulseProfiles } from "@/lib/desk/pulse-profiles";
import { createServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AnalyticsPeoplePage() {
  const desk = await requireDesk("/desk/analytics/people");
  if (!desk.allowed) return null;
  const db = createServiceClient() ?? desk.supabase;
  const people = peopleBreakdown(await fetchPulseProfiles(db));

  return (
    <div className="desk-break-grid">
      <BreakdownCard title="Created by" rows={people.createdBy} />
      <BreakdownCard title="Age" rows={people.age} />
      <BreakdownCard title="Profession" rows={people.profession} />
      <BreakdownCard title="Married status" rows={people.marital} />
      <BreakdownCard title="Income" rows={people.income} />
      <BreakdownCard title="Education" rows={people.education} />
    </div>
  );
}
