import { DeskPager } from "@/app/desk/desk-pager";
import { requireDesk } from "@/lib/desk/access";
import { auditActionLabel, houseRoleLabel } from "@/lib/desk/breakdown";
import { auditDetails, type AuditActor, type AuditEventRow } from "@/lib/desk/audit-log";
import { deskPage, deskRange } from "@/lib/desk/pager";
import { createServiceClient } from "@/lib/supabase/server";
import { formatIstDateTime } from "@/lib/time/ist";
import { btnGhost } from "@/lib/ui/classes";

export const dynamic = "force-dynamic";

export default async function DeskAuditPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const desk = await requireDesk("/desk/audit");
  if (!desk.allowed) return null;
  const { page: rawPage } = await searchParams;
  const page = deskPage(rawPage);
  const { from, to } = deskRange(page);
  const db = createServiceClient() ?? desk.supabase;
  const [{ data, error }, counted] = await Promise.all([
    db
      .from("audit_events")
      .select("id, at, actor_user_id, actor_role, action, entity_type, entity_id, metadata")
      .in("actor_role", ["service", "admin"])
      .order("at", { ascending: false })
      .range(from, to),
    db.from("audit_events").select("id", { count: "exact", head: true }).in("actor_role", ["service", "admin"]),
  ]);

  const rows = error ? [] : ((data ?? []) as AuditEventRow[]);
  const total = counted.count ?? rows.length;
  const actorIds = [...new Set(rows.map((row) => row.actor_user_id).filter((id): id is string => Boolean(id)))];
  const actors = actorIds.length
    ? await db.from("app_users").select("id, display_name, email, role").in("id", actorIds)
    : { data: [] as AuditActor[] };
  const actorById = new Map((actors.data ?? []).map((row) => [row.id, row]));

  return (
    <div className="desk-audit">
      <div className="desk-audit-toolbar">
        <p className="browse-saved-note">
          Staff and Admin activity — who, what, when (IST), and which record. 20 per page, newest first.
        </p>
        <a href="/desk/audit/export" className={btnGhost}>
          Export CSV
        </a>
      </div>
      {rows.length ? (
        <div className="desk-audit-scroll">
          <table className="desk-audit-table">
            <thead>
              <tr>
                <th>Time (IST)</th>
                <th>Actor</th>
                <th>Role</th>
                <th>Action</th>
                <th>Record</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const actor = row.actor_user_id ? actorById.get(row.actor_user_id) : null;
                const name = actor?.display_name || actor?.email || houseRoleLabel(row.actor_role);
                const details = auditDetails(row.metadata);
                return (
                  <tr key={row.id}>
                    <td>
                      <time dateTime={row.at}>{formatIstDateTime(row.at)}</time>
                    </td>
                    <td>
                      <strong>{name}</strong>
                      {actor?.email && actor.display_name ? <small>{actor.email}</small> : null}
                    </td>
                    <td>{houseRoleLabel(row.actor_role)}</td>
                    <td>
                      <strong>{auditActionLabel(row.action)}</strong>
                      <small>{row.action}</small>
                    </td>
                    <td title={row.entity_id ?? undefined}>
                      {row.entity_type}
                      {row.entity_id ? ` · ${row.entity_id.slice(0, 8)}` : ""}
                    </td>
                    <td>{details || "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="desk-empty">No Staff or Admin moves logged yet.</p>
      )}
      <DeskPager path="/desk/audit" page={page} count={total} always />
    </div>
  );
}
