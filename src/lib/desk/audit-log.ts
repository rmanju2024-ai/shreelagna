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

export type AuditSubjectNote = {
  title?: string;
  email?: string;
  place?: string;
  plan?: string;
  fromTitle?: string;
  toTitle?: string;
};

function nice(value: unknown) {
  return String(value).replace(/_/g, " ").trim();
}

/** Action taken, plus the member it was taken on — without repeating other columns. */
export function auditDetails(
  row: Pick<AuditEventRow, "action" | "entity_type" | "metadata"> | Record<string, unknown> | null | undefined,
  subject?: AuditSubjectNote | null,
): string {
  const action = row && "action" in row ? String(row.action ?? "") : "";
  const metadata =
    row && "metadata" in row && row.metadata && typeof row.metadata === "object"
      ? (row.metadata as Record<string, unknown>)
      : row && !("action" in (row as object)) && row && typeof row === "object"
        ? (row as Record<string, unknown>)
        : null;

  if (action === "interest.accepted" || action === "interest.declined") {
    const from = subject?.fromTitle || "a member";
    const to = subject?.toTitle || "a member";
    return action === "interest.accepted"
      ? `${to} accepted interest from ${from}`
      : `${to} declined interest from ${from}`;
  }

  const facts: string[] = [];
  const seen = new Set<string>();
  function add(part: string) {
    const text = part.replace(/\s+/g, " ").trim();
    if (!text) return;
    const key = text.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    facts.push(text);
  }

  if (metadata) {
    if (metadata.status) add(nice(metadata.status));
    const doc = metadata.documentType ?? metadata.document_type;
    if (doc) add(`${nice(doc)} document`);
    if (metadata.section) add(`edited ${nice(metadata.section)}`);
    if (metadata.field) add(`field ${nice(metadata.field)}`);
    if (metadata.trustTier) add(`trust ${nice(metadata.trustTier)}`);
    const plan = subject?.plan || metadata.plan || metadata.plan_code;
    if (plan) add(`plan ${nice(plan)}`);
    if (metadata.months) add(`${metadata.months} months`);
    if (metadata.price) add(`price ${metadata.price}`);
  } else if (subject?.plan) {
    add(`plan ${subject.plan}`);
  }

  if (subject?.title) add(`on ${subject.title}`);
  if (subject?.place) add(subject.place);

  return facts.join(" · ");
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
    auditDetails(row, subject),
  ];
}

export function toCsv(headers: readonly string[], rows: string[][]): string {
  return [headers as unknown as string[], ...rows].map((line) => line.map(csvCell).join(",")).join("\r\n") + "\r\n";
}

function csvCell(value: string): string {
  if (/[",\r\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}
