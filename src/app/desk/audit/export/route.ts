import { requireDesk } from "@/lib/desk/access";
import {
  AUDIT_CSV_HEADERS,
  AUDIT_EXPORT_LIMIT,
  formatAuditCsvRow,
  toCsv,
  type AuditActor,
  type AuditEventRow,
} from "@/lib/desk/audit-log";
import { createServiceClient } from "@/lib/supabase/server";
import { istDayKey } from "@/lib/time/ist";

export const dynamic = "force-dynamic";

export async function GET() {
  const desk = await requireDesk("/desk/audit");
  if (!desk.allowed) return new Response("Forbidden", { status: 403 });
  const db = createServiceClient() ?? desk.supabase;
  const { data, error } = await db
    .from("audit_events")
    .select("id, at, actor_user_id, actor_role, action, entity_type, entity_id, metadata")
    .in("actor_role", ["service", "admin"])
    .neq("entity_type", "ticket")
    .order("at", { ascending: false })
    .limit(AUDIT_EXPORT_LIMIT);

  const rows = error ? [] : ((data ?? []) as AuditEventRow[]);
  const actorIds = [...new Set(rows.map((row) => row.actor_user_id).filter((id): id is string => Boolean(id)))];
  const actorById = new Map<string, AuditActor>();
  for (let i = 0; i < actorIds.length; i += 100) {
    const slice = actorIds.slice(i, i + 100);
    const { data: actors } = await db.from("app_users").select("id, display_name, email, role").in("id", slice);
    for (const actor of (actors ?? []) as AuditActor[]) actorById.set(actor.id, actor);
  }

  const csv = toCsv(
    AUDIT_CSV_HEADERS,
    rows.map((row) => formatAuditCsvRow(row, row.actor_user_id ? actorById.get(row.actor_user_id) : null)),
  );
  const day = istDayKey(new Date());
  return new Response(`\uFEFF${csv}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="shree-lagna-audit-${day}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
