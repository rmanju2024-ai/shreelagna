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
  "fits",
  "prefers",
  "kundali",
  "nearby",
  "community",
  "viewed_you",
  "you_viewed",
  "custom",
] as const;

export type BrowseView = (typeof BROWSE_VIEWS)[number];
export type BrowseRankView = "fits" | "prefers" | "kundali";
export type BrowseScoreRow = { id: string; score: string | null };

export function emptyBrowseBuckets<T>(): Record<BrowseView, T[]> {
  return {
    fits: [],
    prefers: [],
    kundali: [],
    nearby: [],
    community: [],
    viewed_you: [],
    you_viewed: [],
    custom: [],
  };
}

export function parseBrowseView(raw?: string | null): BrowseView {
  if (raw && (BROWSE_VIEWS as readonly string[]).includes(raw)) return raw as BrowseView;
  return "fits";
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
