import { WELCOME_INTEREST_LIMIT } from "@/lib/membership/catalog";
import { parseInstant } from "@/lib/time/ist";
import type { Membership } from "@/lib/membership/access";

export const DAILY_NEW_FAMILY_CAP = 5;
export const PERIOD_WARN_LEFT = 5;

export type InterestQuota = {
  limit: number | null;
  used: number;
  left: number | null;
  canSend: boolean;
  touchedIds: string[];
  dailyLimit: number | null;
  dailyUsed: number;
  dailyLeft: number | null;
};

export function interestLimitFor(kind: Membership["kind"], planLimit?: number | null): number | null {
  if (kind === "house") return null;
  if (kind === "none") return 0;
  if (kind === "welcome") return WELCOME_INTEREST_LIMIT;
  const n = Number(planLimit);
  if (!Number.isFinite(n) || n < 0) return 80;
  return Math.round(n);
}

export function withBonusSlots(limit: number | null, bonus: number | null | undefined): number | null {
  if (limit == null) return null;
  const extra = Math.max(0, Math.round(Number(bonus) || 0));
  return limit + extra;
}

export function usedInterestsSince(
  rows: { from_profile_id?: string | null; created_at?: string | null }[],
  myIds: string[],
  since: Date | null,
): number {
  const mine = new Set(myIds);
  return rows.filter((row) => {
    if (!mine.has(String(row.from_profile_id ?? ""))) return false;
    if (!since) return true;
    const at = parseInstant(row.created_at);
    return Boolean(at && at.getTime() >= since.getTime());
  }).length;
}

function touchTime(value: string | null | undefined): number | null {
  const at = parseInstant(value);
  return at ? at.getTime() : null;
}

export function firstTouchByFamily(
  interests: { from_profile_id?: string | null; to_profile_id?: string | null; created_at?: string | null }[],
  views: { viewer_profile_id?: string | null; viewed_profile_id?: string | null; created_at?: string | null }[],
  myIds: string[],
): Map<string, number> {
  const mine = new Set(myIds);
  const first = new Map<string, number>();
  const remember = (id: string, at: number | null) => {
    if (!id || at == null) return;
    const prev = first.get(id);
    if (prev == null || at < prev) first.set(id, at);
  };
  for (const row of interests) {
    if (!mine.has(String(row.from_profile_id ?? ""))) continue;
    remember(String(row.to_profile_id ?? ""), touchTime(row.created_at));
  }
  for (const row of views) {
    if (!mine.has(String(row.viewer_profile_id ?? ""))) continue;
    remember(String(row.viewed_profile_id ?? ""), touchTime(row.created_at));
  }
  return first;
}

export function usedUniqueProfilesSince(
  interests: { from_profile_id?: string | null; to_profile_id?: string | null; created_at?: string | null }[],
  views: { viewer_profile_id?: string | null; viewed_profile_id?: string | null; created_at?: string | null }[],
  myIds: string[],
  since: Date | null,
): string[] {
  const sinceMs = since ? since.getTime() : null;
  const ids: string[] = [];
  for (const [id, at] of firstTouchByFamily(interests, views, myIds)) {
    if (sinceMs != null && at < sinceMs) continue;
    ids.push(id);
  }
  return ids;
}

export function newFamiliesOnDay(
  interests: { from_profile_id?: string | null; to_profile_id?: string | null; created_at?: string | null }[],
  views: { viewer_profile_id?: string | null; viewed_profile_id?: string | null; created_at?: string | null }[],
  myIds: string[],
  dayStart: Date,
  periodStart: Date | null,
): string[] {
  const dayMs = dayStart.getTime();
  const periodMs = periodStart ? periodStart.getTime() : null;
  const ids: string[] = [];
  for (const [id, at] of firstTouchByFamily(interests, views, myIds)) {
    if (periodMs != null && at < periodMs) continue;
    if (at >= dayMs) ids.push(id);
  }
  return ids;
}

export function resolveQuota(
  limit: number | null,
  used: number,
  touchedIds: string[] = [],
  dailyUsed = 0,
  unlimitedDaily = false,
): InterestQuota {
  const safeUsed = Math.max(0, used);
  const safeDaily = Math.max(0, dailyUsed);
  if (limit === null) {
    return {
      limit: null,
      used: safeUsed,
      left: null,
      canSend: true,
      touchedIds,
      dailyLimit: null,
      dailyUsed: safeDaily,
      dailyLeft: null,
    };
  }
  const left = Math.max(0, limit - safeUsed);
  const dailyLimit = unlimitedDaily ? null : DAILY_NEW_FAMILY_CAP;
  const dailyLeft = dailyLimit == null ? null : Math.max(0, dailyLimit - safeDaily);
  const canSend = left > 0 && (dailyLeft == null || dailyLeft > 0);
  return { limit, used: safeUsed, left, canSend, touchedIds, dailyLimit, dailyUsed: safeDaily, dailyLeft };
}

export function periodWarns(quota: Pick<InterestQuota, "left" | "limit">): boolean {
  return quota.limit != null && quota.left != null && quota.left > 0 && quota.left <= PERIOD_WARN_LEFT;
}

export function quotaWindowStart(
  kind: Membership["kind"],
  input: { welcomeStartedAt?: string | Date | null; paidStartsAt?: string | Date | null },
): Date | null {
  if (kind === "paid") return parseInstant(input.paidStartsAt);
  if (kind === "welcome") return parseInstant(input.welcomeStartedAt);
  return null;
}
