import type { Membership } from "@/lib/membership/access";
import { WELCOME_PLAN_NAME } from "@/lib/membership/catalog";
import { DAILY_NEW_FAMILY_CAP, periodWarns, type InterestQuota } from "@/lib/membership/quota";
import { formatIstDate } from "@/lib/time/ist";

export type QuotaSoftKind = "status" | "warn" | "daily" | "capped";

export type QuotaSoftNotice = {
  kind: QuotaSoftKind;
  title: string;
  /** One-line summary for notifications. */
  body: string;
  /** Short lines shown in the plan dialog. */
  points: string[];
  holdMs: number;
};

function firstName(name?: string | null) {
  const part = typeof name === "string" ? name.trim().split(/\s+/)[0] : "";
  return part || "member";
}

function planName(access: Pick<Membership, "kind"> & { label?: string | null }) {
  if (access.kind === "welcome") return WELCOME_PLAN_NAME;
  const label = typeof access.label === "string" ? access.label.trim() : "";
  if (!label) return "your plan";
  return label.replace(/\s+plan$/i, "");
}

function expiryPoint(access: { daysLeft: number; until?: Date | string | null }) {
  const until = access.until instanceof Date ? access.until : access.until ? new Date(access.until) : null;
  if (until && !Number.isNaN(until.getTime())) return `Expires ${formatIstDate(until)}`;
  if (access.daysLeft <= 0) return "Expires today";
  if (access.daysLeft === 1) return "Expires in 1 day";
  return `Expires in ${access.daysLeft} days`;
}

function usagePoint(quota: InterestQuota) {
  if (quota.limit == null) return "";
  const used = Math.max(0, quota.used);
  return `Usage: ${used} of ${quota.limit} families`;
}

function notice(kind: QuotaSoftKind, title: string, points: string[], holdMs: number): QuotaSoftNotice {
  const lines = points.filter(Boolean);
  return { kind, title, points: lines, body: lines.join(" · "), holdMs };
}

export function buildQuotaSoftNotice(
  access: Pick<Membership, "kind" | "live" | "daysLeft"> & {
    label?: string | null;
    until?: Date | string | null;
  },
  quota: InterestQuota,
  reason?: "daily" | "quota" | "send" | "visit",
  who?: { name?: string | null },
): QuotaSoftNotice | null {
  if (!access.live || access.kind === "house") return null;

  const dear = `Dear ${firstName(who?.name)},`;
  const plan = planName(access);

  if (reason === "daily" || (quota.dailyLeft === 0 && quota.left !== 0)) {
    return notice(
      "daily",
      dear,
      [
        plan,
        expiryPoint(access),
        usagePoint(quota),
        `Today's ${DAILY_NEW_FAMILY_CAP} new contacts are used`,
      ],
      7000,
    );
  }
  if (reason === "quota" || quota.left === 0) {
    return notice(
      "capped",
      dear,
      [plan, expiryPoint(access), usagePoint(quota), "Existing chats stay open"],
      8000,
    );
  }
  if (periodWarns(quota) || reason === "send" || reason === "visit") {
    const warn = periodWarns(quota);
    return notice(
      warn ? "warn" : "status",
      dear,
      [plan, expiryPoint(access), usagePoint(quota)],
      warn ? 7500 : 6500,
    );
  }
  return null;
}
