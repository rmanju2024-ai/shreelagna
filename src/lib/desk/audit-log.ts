import { auditActionLabel, houseRoleLabel } from "@/lib/desk/breakdown";
import { formatIstDateTime, parseInstant } from "@/lib/time/ist";

export type AuditEventRow = {
  id: number;
  at: string;
  actor_user_id: string | null;
  actor_role: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  metadata: Record<string, unknown> | null;
};

export type AuditActor = {
  id: string;
  display_name: string | null;
  email: string | null;
  role?: string | null;
};

export const AUDIT_CSV_HEADERS = [
  "Event ID",
  "Time IST",
  "Time UTC",
  "Actor name",
  "Actor email",
  "Actor role",
  "Action code",
  "Action",
  "Entity type",
  "Entity ID",
  "Details",
] as const;

export const AUDIT_EXPORT_LIMIT = 5000;

const DETAIL_KEYS = ["status", "field", "target", "plan", "plan_code", "email", "name", "user", "months", "price"] as const;

export function auditDetails(metadata: Record<string, unknown> | null | undefined): string {
  if (!metadata || typeof metadata !== "object") return "";
  const parts: string[] = [];
  for (const key of DETAIL_KEYS) {
    const value = metadata[key];
    if (value == null || value === "") continue;
    parts.push(`${key} ${String(value)}`);
  }
  return parts.join(" · ");
}

export function auditUtc(at: string): string {
  return parseInstant(at)?.toISOString() ?? "";
}

export function formatAuditCsvRow(row: AuditEventRow, actor?: AuditActor | null): string[] {
  return [
    String(row.id),
    formatIstDateTime(row.at),
    auditUtc(row.at),
    String(actor?.display_name ?? "").trim(),
    String(actor?.email ?? "").trim(),
    houseRoleLabel(row.actor_role || actor?.role),
    row.action,
    auditActionLabel(row.action),
    row.entity_type,
    row.entity_id ?? "",
    auditDetails(row.metadata),
  ];
}

export function toCsv(headers: readonly string[], rows: string[][]): string {
  return [headers as unknown as string[], ...rows].map((line) => line.map(csvCell).join(",")).join("\r\n") + "\r\n";
}

function csvCell(value: string): string {
  if (/[",\r\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}
