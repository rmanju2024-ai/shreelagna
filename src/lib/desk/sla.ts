export const DESK_SLA_MS = 24 * 60 * 60 * 1000;

export const QUEUE_VIEWS = ["all", "mine", "unassigned", "overdue"] as const;
export type QueueView = (typeof QUEUE_VIEWS)[number];

export function parseQueueView(raw?: string | null): QueueView {
  const value = String(raw ?? "").trim();
  return QUEUE_VIEWS.includes(value as QueueView) ? (value as QueueView) : "all";
}

export function impliedDueAt(createdAt?: string | null, dueAt?: string | null): string | null {
  if (dueAt) return dueAt;
  if (!createdAt) return null;
  const start = Date.parse(createdAt);
  if (!Number.isFinite(start)) return null;
  return new Date(start + DESK_SLA_MS).toISOString();
}

export function isClosedDeskStatus(status?: string | null): boolean {
  const value = String(status ?? "");
  return value === "done" || value === "resolved" || value === "dismissed" || value === "approved" || value === "rejected" || value === "expired" || value === "cancelled";
}

export function isOverdueCase(input: {
  createdAt?: string | null;
  dueAt?: string | null;
  status?: string | null;
  now?: number;
}): boolean {
  if (isClosedDeskStatus(input.status)) return false;
  const due = impliedDueAt(input.createdAt, input.dueAt);
  if (!due) return false;
  const at = Date.parse(due);
  return Number.isFinite(at) && at < (input.now ?? Date.now());
}

export function fitsQueue(
  row: { assignedTo?: string | null; createdAt?: string | null; dueAt?: string | null; status?: string | null },
  view: QueueView,
  staffId: string,
): boolean {
  if (view === "all") return true;
  if (view === "mine") return row.assignedTo === staffId;
  if (view === "unassigned") return !row.assignedTo && !isClosedDeskStatus(row.status);
  return isOverdueCase(row);
}

export function slaChip(input: {
  createdAt?: string | null;
  dueAt?: string | null;
  status?: string | null;
  assignedTo?: string | null;
  now?: number;
}): { label: string; tone: "ok" | "warn" | "late" } {
  if (isClosedDeskStatus(input.status)) return { label: "Closed", tone: "ok" };
  if (isOverdueCase(input)) return { label: "Older than 24h", tone: "late" };
  if (!input.assignedTo) return { label: "Unassigned", tone: "warn" };
  return { label: "On the clock", tone: "ok" };
}

export function defaultDueIso(from = new Date()): string {
  return new Date(from.getTime() + DESK_SLA_MS).toISOString();
}
