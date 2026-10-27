import type { Membership } from "@/lib/membership/access";
import { periodWarns, type InterestQuota } from "@/lib/membership/quota";

export type QuotaSoftKind = "status" | "warn" | "daily" | "capped";

export type QuotaSoftNotice = {
  kind: QuotaSoftKind;
  title: string;
  body: string;
  holdMs: number;
};

function daysLine(daysLeft: number) {
  if (daysLeft <= 0) return "Ends today";
  return `${daysLeft} day${daysLeft === 1 ? "" : "s"} left`;
}

function profilesLine(quota: InterestQuota) {
  if (quota.left == null || quota.limit == null) return `${quota.used} profiles used`;
  return `${quota.left} of ${quota.limit} profiles left`;
}

function todayLine(quota: InterestQuota) {
  if (quota.dailyLeft == null) return "";
  return `${quota.dailyLeft} introductions today`;
}

export function buildQuotaSoftNotice(
  access: Pick<Membership, "kind" | "live" | "daysLeft">,
  quota: InterestQuota,
  reason?: "daily" | "quota" | "send" | "visit",
): QuotaSoftNotice | null {
  if (!access.live || access.kind === "house") return null;

  if (reason === "daily" || (quota.dailyLeft === 0 && quota.left !== 0)) {
    return {
      kind: "daily",
      title: "Today’s limit reached",
      body: "5 introductions a day. Resets at midnight IST.",
      holdMs: 7000,
    };
  }
  if (reason === "quota" || quota.left === 0) {
    return {
      kind: "capped",
      title: "Profile limit reached",
      body: "Chat stays open with families already introduced.",
      holdMs: 8000,
    };
  }
  if (periodWarns(quota) || reason === "send" || reason === "visit") {
    const warn = periodWarns(quota);
    return {
      kind: warn ? "warn" : "status",
      title: warn ? "Few profiles left" : "Your plan",
      body: [daysLine(access.daysLeft), profilesLine(quota), todayLine(quota)].filter(Boolean).join(" · "),
      holdMs: warn ? 7500 : 6500,
    };
  }
  return null;
}
