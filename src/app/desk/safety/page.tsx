import { requireDesk } from "@/lib/desk/access";
import { createServiceClient } from "@/lib/supabase/server";
import { updateSafetyCase } from "@/app/desk/safety/actions";
import { btnGhost, btnPrimary, cardClass } from "@/lib/ui/classes";

export default async function DeskSafetyPage() {
  const desk = await requireDesk("/desk/safety");
  if (!desk.allowed) return null;
  const db = createServiceClient() ?? desk.supabase;
  const { data: cases } = await db
    .from("safety_reports")
    .select("id, category, details, status, staff_note, created_at, reporter_profile_id, reported_profile_id")
    .order("created_at", { ascending: false })
    .limit(100);
  return (
    <section className="desk-panel">
      <header className="desk-panel-head"><div><p className="browse-kicker">Trust & safety</p><h2>Safety cases</h2></div><p>{cases?.filter((item) => item.status !== "resolved" && item.status !== "dismissed").length ?? 0} open</p></header>
      {cases?.length ? <ul className="desk-ticket-list">{cases.map((item) => (
        <li key={item.id} className={`${cardClass} card-3d desk-ticket-row`}>
          <span className="desk-ticket-row-main"><b>{item.category.replace(/_/g, " ")}</b><small>{item.details || "No additional details."}</small><small>Reporter: {item.reporter_profile_id} · Profile: {item.reported_profile_id}</small></span>
          <form action={updateSafetyCase} className="desk-ticket-ops">
            <input type="hidden" name="id" value={item.id} />
            <select name="status" defaultValue={item.status}><option value="new">New</option><option value="in_review">In review</option><option value="resolved">Resolved</option><option value="dismissed">Dismissed</option></select>
            <input name="staff_note" defaultValue={item.staff_note ?? ""} placeholder="Internal case note" />
            <button className={btnPrimary}>Update</button>
          </form>
        </li>
      ))}</ul> : <p className="desk-empty">No safety reports yet.</p>}
    </section>
  );
}
