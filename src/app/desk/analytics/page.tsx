import { BreakdownCard, PulseGroup, Stat } from "@/app/desk/analytics/breakdown-card";
import { requireDesk } from "@/lib/desk/access";
import { cachedDeskPulse } from "@/lib/desk/cached";
import { houseRoleLabel } from "@/lib/desk/breakdown";
import { cardClass } from "@/lib/ui/classes";

export default async function DeskAnalyticsPage() {
  const desk = await requireDesk("/desk/analytics");
  if (!desk.allowed) return null;
  const { pulse, created, purchased, usage, staff } = await cachedDeskPulse(desk.admin);

  return (
    <>
      <PulseGroup title="New profiles">
        <Stat label="Today" value={created.today} />
        <Stat label="Last 7 days" value={created.lastWeek} />
        <Stat label="Last 30 days" value={created.lastMonth} />
      </PulseGroup>
      <PulseGroup title="Total profiles">
        <Stat label="Total" value={pulse.profiles} />
        <Stat label="Brides" value={pulse.vadhu} />
        <Stat label="Grooms" value={pulse.vara} />
        <Stat label="Active" value={pulse.active} />
        <Stat label="Hidden / hold" value={pulse.hidden} />
      </PulseGroup>
      <PulseGroup title="Tickets">
        <Stat label="New" value={pulse.ticketsNew} />
        <Stat label="In progress" value={pulse.ticketsBusy} />
        <Stat label="On hold" value={pulse.ticketsHold} />
        <Stat label="Done" value={pulse.ticketsDone} />
      </PulseGroup>
      <PulseGroup title="Interest">
        <Stat label="Pending" value={pulse.interestsPending} />
        <Stat label="Accepted" value={pulse.interestsAccepted} />
        <Stat label="Views (7 days)" value={pulse.viewsWeek} />
      </PulseGroup>
      <div className="desk-break-grid">
        <BreakdownCard title="New profiles by month" rows={created.monthly} />
        <BreakdownCard title="Plans purchased" rows={purchased.monthly} />
        <BreakdownCard title="Plans in use" rows={usage.rows} />
      </div>
      {desk.admin ? (
        <div className="desk-admin-block">
          <p className="browse-kicker">Admin only</p>
          <h3>Staff on duty</h3>
          <ul className="desk-staff-list">
            {staff.map((row) => (
              <li key={row.email} className={`${cardClass} card-3d desk-ticket-row desk-person-row`}>
                <span className="desk-ticket-row-main">
                  <span className="desk-ticket-name">{row.display_name || row.email}</span>
                  <span className={`desk-pill ${row.role === "admin" ? "is-done" : "is-busy"}`}>
                    {houseRoleLabel(row.role)}
                  </span>
                  <span className="desk-ticket-meta">{row.email}</span>
                </span>
              </li>
            ))}
          </ul>
          {!staff.length ? <p className="desk-empty">No staff rows loaded.</p> : null}
        </div>
      ) : (
        <p className="browse-saved-note">Service can work tickets. Place, people, and health tabs sit beside this pulse.</p>
      )}
    </>
  );
}
