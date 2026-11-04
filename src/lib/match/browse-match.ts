import { kundaliInputFromProfile, kundaliScore } from "@/lib/match/kundali";
import {
  preferenceMatchCount,
  preferenceSheetRows,
  type MatchSelf,
} from "@/lib/profile/match-compare";

export const PREFERENCE_POINTS = 15;
export const PREFERENCE_MIN = 10;
export const KUNDALI_MIN = 18;

export const BROWSE_VIEWS = [
  "smart",
  "fits",
  "prefers",
  "kundali",
  "nearby",
  "community",
  "custom",
] as const;

export type BrowseView = (typeof BROWSE_VIEWS)[number];
export type BrowseRankView = "fits" | "prefers" | "kundali";
export type BrowseScoreRow = { id: string; score: string | null };

export function emptyBrowseBuckets<T>(): Record<BrowseView, T[]> {
  return {
    smart: [],
    fits: [],
    prefers: [],
    kundali: [],
    nearby: [],
    community: [],
    custom: [],
  };
}

export function parseBrowseView(raw?: string | null): BrowseView {
  if (raw === "fits" || raw === "prefers") return "smart";
  if (raw && (BROWSE_VIEWS as readonly string[]).includes(raw)) return raw as BrowseView;
  return "smart";
}

/** One Discover row from “Today’s picks” + “They like you”. */
export function mergeSmartPicks(fits: BrowseScoreRow[], prefers: BrowseScoreRow[]): BrowseScoreRow[] {
  const map = new Map<string, BrowseScoreRow>();
  for (const row of fits) map.set(row.id, row);
  for (const row of prefers) {
    const prev = map.get(row.id);
    if (!prev) {
      map.set(row.id, row);
      continue;
    }
    const a = Number.parseInt(prev.score ?? "0", 10);
    const b = Number.parseInt(row.score ?? "0", 10);
    map.set(row.id, a >= b ? prev : row);
  }
  return [...map.values()];
}

export function preferencePoints(prefOwner: Record<string, unknown>, details: MatchSelf): number {
  return preferenceMatchCount(preferenceSheetRows(prefOwner, details)).hit;
}

export function kundaliPoints(a: Record<string, unknown>, b: Record<string, unknown>): number {
  return kundaliScore(kundaliInputFromProfile(a), kundaliInputFromProfile(b)).total;
}

export function browseRank(
  view: BrowseRankView,
  mine: Record<string, unknown>,
  their: Record<string, unknown>,
  mySelf: MatchSelf,
  theirSelf: MatchSelf,
): { pass: boolean; score: number; label: string } {
  if (view === "fits") {
    const score = preferencePoints(mine, theirSelf);
    return {
      pass: score >= PREFERENCE_MIN,
      score,
      label: `${score}/${PREFERENCE_POINTS} of your preference`,
    };
  }
  if (view === "prefers") {
    const score = preferencePoints(their, mySelf);
    return {
      pass: score >= PREFERENCE_MIN,
      score,
      label: `${score}/${PREFERENCE_POINTS} of their preference`,
    };
  }
  const score = kundaliPoints(mine, their);
  return { pass: score >= KUNDALI_MIN, score, label: `Kundali ${score}/36` };
}
