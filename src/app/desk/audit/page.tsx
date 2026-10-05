import { DeskPager } from "@/app/desk/desk-pager";
import { requireDesk } from "@/lib/desk/access";
import { cachedAuditPage } from "@/lib/desk/cached";
import { auditActionLabel, houseRoleLabel } from "@/lib/desk/breakdown";
import { auditDetails, auditRecordLabel, type AuditActor, type AuditEventRow } from "@/lib/desk/audit-log";
import { loadAuditSubjects, subjectKey } from "@/lib/desk/audit-subjects";
import { deskPage, deskRange } from "@/lib/desk/pager";
import { createServiceClient } from "@/lib/supabase/server";
import { formatIstDateTime } from "@/lib/time/ist";
import { btnGhost } from "@/lib/ui/classes";

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
  let rows: AuditEventRow[] = [];
  let total = 0;
  let actorById = new Map<string, AuditActor>();
  try {
    const cached = await cachedAuditPage(from, to);
    rows = cached.rows as AuditEventRow[];
    total = cached.total;
    actorById = new Map((cached.actors as AuditActor[]).map((row) => [row.id, row]));
  } catch {
    const [{ data, error }, counted] = await Promise.all([
      db
        .from("audit_events")
        .select("id, at, actor_user_id, actor_role, action, entity_type, entity_id, metadata")
          .in("actor_role", ["service", "admin"])
          .neq("entity_type", "ticket")
          .order("at", { ascending: false })
          .range(from, to),
      db
        .from("audit_events")
        .select("id", { count: "exact", head: true })
        .in("actor_role", ["service", "admin"])
        .neq("entity_type", "ticket"),
    ]);
    rows = error ? [] : ((data ?? []) as AuditEventRow[]);
    total = counted.count ?? rows.length;
    const actorIds = [...new Set(rows.map((row) => row.actor_user_id).filter((id): id is string => Boolean(id)))];
    const actors = actorIds.length
      ? await db.from("app_users").select("id, display_name, email, role").in("id", actorIds)
      : { data: [] as AuditActor[] };
    actorById = new Map((actors.data ?? []).map((row) => [row.id, row]));
  }
  const subjects = await loadAuditSubjects(db as never, rows);

  return (
    <div className="desk-audit">
      <div className="desk-audit-toolbar">
        <p className="browse-saved-note">
          Staff and Admin activity — who acted, which member profile, which plan, and where. 20 per page, newest first.
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
                <th>Profile</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const actor = row.actor_user_id ? actorById.get(row.actor_user_id) : null;
                const name = actor?.display_name || actor?.email || houseRoleLabel(row.actor_role);
                const subject = subjects.get(subjectKey(row.entity_type, row.entity_id));
                const details = auditDetails(row.metadata, subject);
                const record = auditRecordLabel(row, subject);
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
                      {subject?.href ? (
                        <a href={subject.href}>{record}</a>
                      ) : (
                        record
                      )}
                      {subject?.email ? <small>{subject.email}</small> : null}
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
