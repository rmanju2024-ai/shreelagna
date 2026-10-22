import type { Membership } from "@/lib/membership/access";
import { periodWarns, type InterestQuota } from "@/lib/membership/quota";

export type QuotaSoftKind = "status" | "warn" | "daily" | "capped";

export type QuotaSoftNotice = {
  kind: QuotaSoftKind;
  title: string;
  body: string;
  holdMs: number;
};

export function buildQuotaSoftNotice(
  access: Pick<Membership, "kind" | "live" | "daysLeft">,
  quota: InterestQuota,
  reason?: "daily" | "quota" | "send" | "visit",
): QuotaSoftNotice | null {
  if (!access.live || access.kind === "house") return null;
  const days = access.daysLeft > 0 ? `${access.daysLeft} day${access.daysLeft === 1 ? "" : "s"} left on this cover` : "Cover ends today";
  const families =
    quota.left == null ? `${quota.used} families introduced` : `${quota.left} famil${quota.left === 1 ? "y" : "ies"} remaining of ${quota.limit}`;
  const today =
    quota.dailyLeft == null ? "" : `${quota.dailyLeft} new introduction${quota.dailyLeft === 1 ? "" : "s"} left today`;

  if (reason === "daily" || (quota.dailyLeft === 0 && quota.left !== 0)) {
    return {
      kind: "daily",
      title: "Today’s five introductions are used",
      body: `${days}. ${families}. Five more open after midnight IST.`,
      holdMs: 7000,
    };
  }
  if (reason === "quota" || quota.left === 0) {
    return {
      kind: "capped",
      title: "This cover’s family limit is used",
      body: `${days}. You can keep chatting with families already introduced, or add Five more.`,
      holdMs: 8000,
    };
  }
  if (periodWarns(quota) || reason === "send" || reason === "visit") {
    const warn = periodWarns(quota);
    return {
      kind: warn ? "warn" : "status",
      title: warn ? "A few introductions remain" : "Your introduction balance",
      body: [days, families, today].filter(Boolean).join(" · "),
      holdMs: warn ? 7500 : 6500,
    };
  }
  return null;
}
