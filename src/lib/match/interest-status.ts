import { formatIstDateTime } from "@/lib/time/ist";

export const INTEREST_EXPIRE_DAYS = 50;

export const INTEREST_STATUSES = ["pending", "accepted", "declined", "expired", "deleted"] as const;

export type InterestStatus = (typeof INTEREST_STATUSES)[number];

export function asInterestStatus(value: unknown): InterestStatus {
  return INTEREST_STATUSES.includes(value as InterestStatus) ? (value as InterestStatus) : "pending";
}

export function isStalePending(createdAt: string | Date, now = Date.now()): boolean {
  const at = createdAt instanceof Date ? createdAt : new Date(createdAt);
  if (Number.isNaN(at.getTime())) return false;
  return now - at.getTime() >= INTEREST_EXPIRE_DAYS * 24 * 60 * 60 * 1000;
}

export function effectiveInterestStatus(
  status: unknown,
  createdAt: string | Date,
  now = Date.now(),
): InterestStatus {
  const current = asInterestStatus(status);
  if (current === "pending" && isStalePending(createdAt, now)) return "expired";
  return current;
}

export function interestStatusLabel(status: InterestStatus): string {
  if (status === "accepted") return "Accepted";
  if (status === "declined") return "Declined";
  if (status === "expired") return "Expired";
  if (status === "deleted") return "Deleted";
  return "Pending";
}

export function isHistoryStatus(status: InterestStatus): boolean {
  return status === "declined" || status === "expired" || status === "deleted";
}

export type InterestThread = "none" | "sent" | "received" | "accepted" | "closed";

export function interestThreadState(
  status: InterestStatus | null | undefined,
  sentByMe: boolean,
): InterestThread {
  if (!status) return "none";
  if (status === "accepted") return "accepted";
  if (status === "declined" || status === "expired" || status === "deleted") return "closed";
  return sentByMe ? "sent" : "received";
}

export function openInterestBlocksSend(status: InterestStatus | null | undefined): boolean {
  return status === "pending" || status === "accepted";
}

export function hasAcceptedInterest(
  rows: { from_profile_id?: string | null; to_profile_id?: string | null; status?: string | null; created_at?: string | null }[],
  a: string,
  b: string,
): boolean {
  return rows.some((row) => {
    const from = String(row.from_profile_id ?? "");
    const to = String(row.to_profile_id ?? "");
    const pair = (from === a && to === b) || (from === b && to === a);
    return pair && effectiveInterestStatus(row.status, row.created_at ?? "") === "accepted";
  });
}

export const DECLINE_REASON_MAX = 280;

export function trimDeclineReason(value: unknown): string | null {
  const text = String(value ?? "").replace(/\s+/g, " ").trim();
  if (!text) return null;
  return text.slice(0, DECLINE_REASON_MAX);
}

export function formatInboxWhen(iso: string | Date): string {
  return formatIstDateTime(iso);
}
