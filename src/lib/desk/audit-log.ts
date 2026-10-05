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

const DETAIL_KEYS = [
  "status",
  "field",
  "target",
  "plan",
  "plan_code",
  "email",
  "name",
  "months",
  "price",
  "documentType",
  "document_type",
  "trustTier",
  "section",
  "memberCode",
  "place",
  "profile",
] as const;

const KEY_LABEL: Record<string, string> = {
  status: "Status",
  field: "Field",
  target: "Target",
  plan: "Plan",
  plan_code: "Plan",
  email: "Gmail",
  name: "Name",
  months: "Months",
  price: "Price",
  documentType: "Document",
  document_type: "Document",
  trustTier: "Trust",
  section: "Section",
  memberCode: "ID",
  place: "Place",
  profile: "Profile",
};

export type AuditSubjectNote = {
  title?: string;
  email?: string;
  place?: string;
  plan?: string;
};

export function auditDetails(
  metadata: Record<string, unknown> | null | undefined,
  subject?: AuditSubjectNote | null,
): string {
  const parts: string[] = [];
  const seen = new Set<string>();
  function add(label: string, value: unknown) {
    if (value == null || value === "") return;
    const text = `${label} ${String(value)}`.trim();
    const key = text.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    parts.push(text);
  }
  if (subject?.title) add("Profile", subject.title);
  if (subject?.email) add("Gmail", subject.email);
  if (subject?.place) add("Place", subject.place);
  if (subject?.plan) add("Plan", subject.plan);
  if (!metadata || typeof metadata !== "object") return parts.join(" · ");
  for (const key of DETAIL_KEYS) {
    add(KEY_LABEL[key] ?? key, metadata[key]);
  }
  return parts.join(" · ");
}

export function auditRecordLabel(
  row: Pick<AuditEventRow, "entity_type" | "entity_id">,
  subject?: AuditSubjectNote | null,
): string {
  if (subject?.title) return subject.title;
  if (!row.entity_id) return row.entity_type;
  return `${row.entity_type} · ${row.entity_id.slice(0, 8)}`;
}

export function auditUtc(at: string): string {
  return parseInstant(at)?.toISOString() ?? "";
}

export function formatAuditCsvRow(
  row: AuditEventRow,
  actor?: AuditActor | null,
  subject?: AuditSubjectNote | null,
): string[] {
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
    subject?.title || row.entity_id || "",
    auditDetails(row.metadata, subject),
  ];
}

export function toCsv(headers: readonly string[], rows: string[][]): string {
  return [headers as unknown as string[], ...rows].map((line) => line.map(csvCell).join(",")).join("\r\n") + "\r\n";
}

function csvCell(value: string): string {
  if (/[",\r\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}
