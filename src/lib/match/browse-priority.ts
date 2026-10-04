/**
 * Listing order used by every Discover category:
 * 1. subscribed profiles, 2. very active, 3. active, 4. higher income, 5. closest age, then the list's own order.
 */
const DAY = 86_400_000;
export const VERY_ACTIVE_DAYS = 3;
export const ACTIVE_DAYS = 30;

export type BrowsePriority = {
  subscribed: boolean;
  /** 2 = very active, 1 = active, 0 = otherwise or hidden */
  activity: 0 | 1 | 2;
  income: number;
  ageGap: number;
};

export function activityTier(lastSeenIso: unknown, hidden: boolean, now = Date.now()): 0 | 1 | 2 {
  if (hidden || typeof lastSeenIso !== "string") return 0;
  const seen = Date.parse(lastSeenIso);
  if (Number.isNaN(seen)) return 0;
  const age = now - seen;
  if (age <= VERY_ACTIVE_DAYS * DAY) return 2;
  if (age <= ACTIVE_DAYS * DAY) return 1;
  return 0;
}

/** Highest figure in a band such as "₹10–15 lakh" or "₹1+ crore", in lakh. Unknown = 0. */
export function incomeRank(band: unknown): number {
  if (typeof band !== "string") return 0;
  const numbers = band.replace(/,/g, "").match(/\d+(?:\.\d+)?/g)?.map(Number) ?? [];
  if (!numbers.length) return 0;
  const top = Math.max(...numbers);
  return /crore|cr\b/i.test(band) ? top * 100 : top;
}

export function isSubscribedRow(row: Record<string, unknown>): boolean {
  if (row.is_subscribed === true) return true;
  const until = row.subscription_until;
  return typeof until === "string" && Date.parse(until) > Date.now();
}

export function compareBrowsePriority(a: BrowsePriority | undefined, b: BrowsePriority | undefined): number {
  if (!a || !b) return 0;
  if (a.subscribed !== b.subscribed) return a.subscribed ? -1 : 1;
  if (a.activity !== b.activity) return b.activity - a.activity;
  if (a.income !== b.income) return b.income - a.income;
  return a.ageGap - b.ageGap;
}

export function sortByPriority<T extends { id: string }>(rows: T[], priority: Map<string, BrowsePriority>): T[] {
  return rows
    .map((row, index) => ({ row, index }))
    .sort((x, y) => compareBrowsePriority(priority.get(x.row.id), priority.get(y.row.id)) || x.index - y.index)
    .map((item) => item.row);
}
