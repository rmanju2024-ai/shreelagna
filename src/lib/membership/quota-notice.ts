import type { Membership } from "@/lib/membership/access";
import { WELCOME_PLAN_NAME } from "@/lib/membership/catalog";
import { DAILY_NEW_FAMILY_CAP, periodWarns, type InterestQuota } from "@/lib/membership/quota";

export type QuotaSoftKind = "status" | "warn" | "daily" | "capped";

export type QuotaSoftNotice = {
  kind: QuotaSoftKind;
  title: string;
  body: string;
  holdMs: number;
};

function firstName(name?: string | null) {
  const part = typeof name === "string" ? name.trim().split(/\s+/)[0] : "";
  return part || "member";
}

function planName(access: Pick<Membership, "kind" | "label">) {
  if (access.kind === "welcome") return WELCOME_PLAN_NAME;
  const label = typeof access.label === "string" ? access.label.trim() : "";
  if (!label) return "your plan";
  return label.replace(/\s+plan$/i, "");
}

function daysPhrase(daysLeft: number) {
  if (daysLeft <= 0) return "the plan ends today";
  if (daysLeft === 1) return "1 day left on this plan";
  return `${daysLeft} days left on this plan`;
}

function planBalance(quota: InterestQuota) {
  if (quota.left == null || quota.limit == null) return "";
  if (quota.left === 0) return "No families are left on this plan.";
  if (quota.left === 1) return `This plan still has 1 of ${quota.limit} families available.`;
  return `This plan still has ${quota.left} of ${quota.limit} families available.`;
}

function dailyPace(quota: InterestQuota) {
  const cap = DAILY_NEW_FAMILY_CAP;
  if (quota.dailyLeft == null) return "";
  if (quota.dailyLeft === 0) {
    return `Each day you may contact up to ${cap} new families. Today's ${cap} are used.`;
  }
  if (quota.dailyLeft === 1) {
    return `Each day you may contact up to ${cap} new families. You have 1 of today's ${cap} remaining.`;
  }
  if (quota.dailyLeft === cap) {
    return `Each day you may contact up to ${cap} new families. Today's ${cap} are still unused.`;
  }
  return `Each day you may contact up to ${cap} new families. You have ${quota.dailyLeft} of today's ${cap} remaining.`;
}

export function buildQuotaSoftNotice(
  access: Pick<Membership, "kind" | "live" | "daysLeft"> & { label?: string | null },
  quota: InterestQuota,
  reason?: "daily" | "quota" | "send" | "visit",
  who?: { name?: string | null },
): QuotaSoftNotice | null {
  if (!access.live || access.kind === "house") return null;

  const dear = `Dear ${firstName(who?.name)},`;
  const plan = planName(access);

  if (reason === "daily" || (quota.dailyLeft === 0 && quota.left !== 0)) {
    return {
      kind: "daily",
      title: dear,
      body: `You are on the ${plan} plan. This is not the end of your plan — it is only today's pace. Each day you may contact up to ${DAILY_NEW_FAMILY_CAP} new families. Today's ${DAILY_NEW_FAMILY_CAP} are used. You may contact more after midnight IST, until the families on your plan are finished.`,
      holdMs: 7000,
    };
  }
  if (reason === "quota" || quota.left === 0) {
    return {
      kind: "capped",
      title: dear,
      body: `You are on the ${plan} plan. The family limit for this plan has been reached. You may continue chatting with families you have already contacted.`,
      holdMs: 8000,
    };
  }
  if (periodWarns(quota) || reason === "send" || reason === "visit") {
    const warn = periodWarns(quota);
    const body = [
      `You are on the ${plan} plan (${daysPhrase(access.daysLeft)}).`,
      planBalance(quota),
      dailyPace(quota),
    ]
      .filter(Boolean)
      .join(" ");
    return {
      kind: warn ? "warn" : "status",
      title: dear,
      body,
      holdMs: warn ? 7500 : 6500,
    };
  }
  return null;
}
