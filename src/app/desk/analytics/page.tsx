import { BreakdownCard, PulseGroup, Stat } from "@/app/desk/analytics/breakdown-card";
import { requireDesk } from "@/lib/desk/access";
import { createdTrend, houseRoleLabel, planUsage } from "@/lib/desk/breakdown";
import { EMPTY_DESK_PULSE } from "@/lib/desk/stats";
import { daysLeft, welcomeUntil } from "@/lib/membership/access";
import { WELCOME_DAYS } from "@/lib/membership/catalog";
import { fetchPlans } from "@/lib/membership/load";
import { createServiceClient } from "@/lib/supabase/server";
import { cardClass } from "@/lib/ui/classes";

export const dynamic = "force-dynamic";

export default async function DeskAnalyticsPage() {
  const desk = await requireDesk("/desk/analytics");
  if (!desk.allowed) return null;
  const db = createServiceClient() ?? desk.supabase;
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000).toISOString();
  const welcomeSince = new Date(now.getTime() - WELCOME_DAYS * 24 * 60 * 60 * 1000).toISOString();

  const [
    members,
    profiles,
    vadhu,
    vara,
    active,
    hidden,
    ticketsNew,
    ticketsBusy,
    ticketsHold,
    ticketsDone,
    interestsPending,
    interestsAccepted,
    views,
    recent,
    staff,
    memberCount,
    paidRows,
    welcomeWindow,
    catalog,
    purchaseRows,
  ] = await Promise.all([
    db.from("app_users").select("id", { count: "exact", head: true }),
    db.from("profiles").select("id", { count: "exact", head: true }),
    db.from("profiles").select("id", { count: "exact", head: true }).eq("profile_type", "vadhu"),
    db.from("profiles").select("id", { count: "exact", head: true }).eq("profile_type", "vara"),
    db.from("profiles").select("id", { count: "exact", head: true }).eq("status", "active"),
    db.from("profiles").select("id", { count: "exact", head: true }).in("status", ["hidden", "on_hold"]),
    db.from("tickets").select("id", { count: "exact", head: true }).eq("status", "new"),
    db.from("tickets").select("id", { count: "exact", head: true }).eq("status", "in_progress"),
    db.from("tickets").select("id", { count: "exact", head: true }).eq("status", "on_hold"),
    db.from("tickets").select("id", { count: "exact", head: true }).eq("status", "done"),
    db.from("interests").select("id", { count: "exact", head: true }).eq("status", "pending"),
    db.from("interests").select("id", { count: "exact", head: true }).eq("status", "accepted"),
    db.from("profile_views").select("id", { count: "exact", head: true }).gte("viewed_at", weekAgo),
    db.from("profiles").select("created_at").gte("created_at", yearAgo).order("created_at", { ascending: false }).limit(2000),
    desk.admin
      ? db.from("app_users").select("email, role, display_name").in("role", ["service", "admin"]).order("role")
      : Promise.resolve({ data: [] as { email: string; role: string; display_name: string | null }[] }),
    db.from("app_users").select("id", { count: "exact", head: true }).eq("role", "member"),
    db.from("memberships").select("user_id, plan_code, ends_at").eq("status", "active").limit(3000),
    db.from("app_users").select("id", { count: "exact", head: true }).eq("role", "member").gte("welcome_started_at", welcomeSince),
    fetchPlans(db),
    db
      .from("memberships")
      .select("activated_at, starts_at, created_at, status")
      .in("status", ["active", "cancelled"])
      .gte("created_at", yearAgo)
      .limit(3000),
  ]);

  const pulse = {
    ...EMPTY_DESK_PULSE,
    members: members.count ?? 0,
    profiles: profiles.count ?? 0,
    vadhu: vadhu.count ?? 0,
    vara: vara.count ?? 0,
    active: active.count ?? 0,
    hidden: hidden.count ?? 0,
    ticketsNew: ticketsNew.count ?? 0,
    ticketsBusy: ticketsBusy.count ?? 0,
    ticketsHold: ticketsHold.count ?? 0,
    ticketsDone: ticketsDone.count ?? 0,
    interestsPending: interestsPending.count ?? 0,
    interestsAccepted: interestsAccepted.count ?? 0,
    viewsWeek: views.count ?? 0,
  };
  const created = createdTrend(recent.data ?? []);
  const purchased = createdTrend(
    ((purchaseRows.data ?? []) as {
      activated_at?: string | null;
      starts_at?: string | null;
      created_at?: string | null;
      status?: string | null;
    }[]).flatMap((row) => {
      const at = row.activated_at || row.starts_at || (row.status === "active" ? row.created_at : null);
      return at ? [{ created_at: at }] : [];
    }),
    now,
  );
  const paid = (paidRows.data ?? []) as { user_id?: string | null; plan_code?: string | null; ends_at?: string | null }[];
  const livePaidIds = [
    ...new Set(
      paid
        .filter((row) => !row.ends_at || new Date(row.ends_at).getTime() > now.getTime())
        .map((row) => String(row.user_id ?? "").trim())
        .filter(Boolean),
    ),
  ];
  const paidPeople = livePaidIds.length
    ? await db.from("app_users").select("id, welcome_started_at, welcome_days").in("id", livePaidIds.slice(0, 500))
    : { data: [] as { welcome_started_at?: string | null; welcome_days?: number | null }[] };
  const paidWelcomeOverlap = (paidPeople.data ?? []).filter(
    (row) => daysLeft(welcomeUntil(row.welcome_started_at, row.welcome_days ?? WELCOME_DAYS, now), now) > 0,
  ).length;
  const usage = planUsage({
    memberCount: memberCount.count ?? 0,
    welcomeWindowCount: welcomeWindow.count ?? 0,
    paid,
    paidWelcomeOverlap,
    catalog,
    now,
  });

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
            {(staff.data ?? []).map((row) => (
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
          {!(staff.data ?? []).length ? <p className="desk-empty">No staff rows loaded.</p> : null}
        </div>
      ) : (
        <p className="browse-saved-note">Service can work tickets. Place, people, and health tabs sit beside this pulse.</p>
      )}
    </>
  );
}
