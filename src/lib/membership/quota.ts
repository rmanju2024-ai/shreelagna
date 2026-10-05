import { WELCOME_INTEREST_LIMIT } from "@/lib/membership/catalog";
import { parseInstant } from "@/lib/time/ist";
import type { Membership } from "@/lib/membership/access";

export type InterestQuota = {
  limit: number | null;
  used: number;
  left: number | null;
  canSend: boolean;
  touchedIds: string[];
};

export function interestLimitFor(kind: Membership["kind"], planLimit?: number | null): number | null {
  if (kind === "house") return null;
  if (kind === "none") return 0;
  if (kind === "welcome") return WELCOME_INTEREST_LIMIT;
  const n = Number(planLimit);
  if (!Number.isFinite(n) || n < 0) return 80;
  return Math.round(n);
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

export function usedUniqueProfilesSince(
  interests: { from_profile_id?: string | null; to_profile_id?: string | null; created_at?: string | null }[],
  views: { viewer_profile_id?: string | null; viewed_profile_id?: string | null; created_at?: string | null }[],
  myIds: string[],
  since: Date | null,
): string[] {
  const mine = new Set(myIds);
  const ids = new Set<string>();
  for (const row of interests) {
    if (!mine.has(String(row.from_profile_id ?? ""))) continue;
    if (since) {
      const at = parseInstant(row.created_at);
      if (!at || at.getTime() < since.getTime()) continue;
    }
    const to = String(row.to_profile_id ?? "");
    if (to) ids.add(to);
  }
  for (const row of views) {
    if (!mine.has(String(row.viewer_profile_id ?? ""))) continue;
    if (since) {
      const at = parseInstant(row.created_at);
      if (!at || at.getTime() < since.getTime()) continue;
    }
    const to = String(row.viewed_profile_id ?? "");
    if (to) ids.add(to);
  }
  return [...ids];
}

export function resolveQuota(limit: number | null, used: number, touchedIds: string[] = []): InterestQuota {
  if (limit === null) return { limit: null, used, left: null, canSend: true, touchedIds };
  const safeUsed = Math.max(0, used);
  const left = Math.max(0, limit - safeUsed);
  return { limit, used: safeUsed, left, canSend: left > 0, touchedIds };
}

export function quotaWindowStart(
  kind: Membership["kind"],
  input: { welcomeStartedAt?: string | Date | null; paidStartsAt?: string | Date | null },
): Date | null {
  if (kind === "paid") return parseInstant(input.paidStartsAt);
  if (kind === "welcome") return parseInstant(input.welcomeStartedAt);
  return null;
}
