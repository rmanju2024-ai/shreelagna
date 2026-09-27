import { appointStaff, removeStaff } from "@/app/desk/staff/actions";
import { requireDesk } from "@/lib/desk/access";
import { createServiceClient } from "@/lib/supabase/server";
import { btnGhost, btnPrimary, cardClass, inputClass } from "@/lib/ui/classes";

export const dynamic = "force-dynamic";

export default async function DeskStaffPage() {
  const desk = await requireDesk("/desk/staff");
  if (!desk.allowed) return null;
  if (!desk.admin) {
    return (
      <section className="desk-panel">
        <p className="browse-kicker">Staff</p>
        <h2>Admin only</h2>
        <p className="desk-empty">Service cannot appoint or remove desk operators.</p>
      </section>
    );
  }

  const db = createServiceClient() ?? desk.supabase;
  const { data: rows } = await db
    .from("app_users")
    .select("id, email, display_name, role")
    .in("role", ["service", "admin"])
    .order("display_name");
  const staff = (rows ?? []).filter((row) => row.role === "service");
  const admins = (rows ?? []).filter((row) => row.role === "admin");

  return (
    <section className="desk-panel">
      <header className="desk-panel-head">
        <div>
          <p className="browse-kicker">Staff</p>
          <h2>Appoint and remove</h2>
        </div>
      </header>
      <form action={appointStaff} className="desk-ticket-note-form">
        <label className="desk-ticket-note-label">
          Member Gmail
          <input name="email" type="email" required className={inputClass} placeholder="name@gmail.com" />
        </label>
        <button type="submit" className={btnPrimary}>
          Appoint as staff
        </button>
      </form>
      <p className="browse-saved-note">
        Staff get the service desk. Admin stays admin. Remove staff to send them back to member — the Gmail is not deleted.
      </p>
      <h3 className="desk-section-title">Staff</h3>
      <ul className="desk-staff-list">
        {staff.length ? (
          staff.map((row) => (
            <li key={row.id} className={`${cardClass} card-3d desk-ticket-row desk-person-row`}>
              <span className="desk-ticket-row-main">
                <span className="desk-ticket-name">{row.display_name || row.email}</span>
                <span className="desk-pill is-busy">Staff</span>
                <span className="desk-ticket-meta">{row.email}</span>
              </span>
              <form action={removeStaff}>
                <input type="hidden" name="id" value={row.id} />
                <button type="submit" className={btnGhost}>
                  Remove staff
                </button>
              </form>
            </li>
          ))
        ) : (
          <li className="desk-empty">No staff appointed.</li>
        )}
      </ul>
      <h3 className="desk-section-title">Admin</h3>
      <ul className="desk-staff-list">
        {admins.length ? (
          admins.map((row) => (
            <li key={row.id} className={`${cardClass} card-3d desk-ticket-row desk-person-row`}>
              <span className="desk-ticket-row-main">
                <span className="desk-ticket-name">{row.display_name || row.email}</span>
                <span className="desk-pill is-done">Admin</span>
                <span className="desk-ticket-meta">{row.email}</span>
              </span>
            </li>
          ))
        ) : (
          <li className="desk-empty">No admin listed.</li>
        )}
      </ul>
    </section>
  );
}
