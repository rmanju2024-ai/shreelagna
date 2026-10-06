import { WELCOME_DAYS, WELCOME_PLAN_NAME, planByCode } from "@/lib/membership/catalog";
import { parseInstant } from "@/lib/time/ist";

const DAY_MS = 24 * 60 * 60 * 1000;

export type PaidRow = {
  plan_code?: string | null;
  status?: string | null;
  starts_at?: string | null;
  ends_at?: string | null;
};

export type MembershipKind = "house" | "welcome" | "paid" | "none";

export type Membership = {
  kind: MembershipKind;
  live: boolean;
  label: string;
  until: Date | null;
  daysLeft: number;
  planCode: string | null;
};

export function welcomeUntil(
  startedAt: string | Date | null | undefined,
  days = WELCOME_DAYS,
  now = new Date(),
): Date | null {
  const start = parseInstant(startedAt) ?? now;
  const span = Number.isFinite(days) && days > 0 ? days : WELCOME_DAYS;
  return new Date(start.getTime() + span * DAY_MS);
}

export function daysLeft(until: Date | null, now = new Date()): number {
  if (!until) return 0;
  return Math.max(0, Math.ceil((until.getTime() - now.getTime()) / DAY_MS));
}

export function resolveMembership(input: {
  role?: string | null;
  welcomeStartedAt?: string | Date | null;
  welcomeDays?: number | null;
  paid?: PaidRow | null;
  planName?: string | null;
  now?: Date;
}): Membership {
  const now = input.now ?? new Date();
  if (input.role === "admin") {
    return { kind: "house", live: true, label: "Admin house access", until: null, daysLeft: 0, planCode: null };
  }
  if (input.role === "service") {
    return { kind: "house", live: true, label: "Staff house access", until: null, daysLeft: 0, planCode: null };
  }

  const paidUntil = parseInstant(input.paid?.ends_at ?? null);
  const paidLive =
    input.paid?.status === "active" && paidUntil != null && paidUntil.getTime() > now.getTime();
  if (paidLive && paidUntil) {
    const plan = planByCode(input.paid?.plan_code ?? "");
    const name = input.planName || plan?.name;
    return {
      kind: "paid",
      live: true,
      label: name ? `${name} plan` : "Paid plan",
      until: paidUntil,
      daysLeft: daysLeft(paidUntil, now),
      planCode: input.paid?.plan_code ?? plan?.code ?? null,
    };
  }

  const giftUntil = welcomeUntil(input.welcomeStartedAt, input.welcomeDays ?? WELCOME_DAYS, now);
  if (giftUntil && giftUntil.getTime() > now.getTime()) {
    return {
      kind: "welcome",
      live: true,
      label: WELCOME_PLAN_NAME,
      until: giftUntil,
      daysLeft: daysLeft(giftUntil, now),
      planCode: "welcome",
    };
  }

  return {
    kind: "none",
    live: false,
    label: "Plan needed",
    until: giftUntil,
    daysLeft: 0,
    planCode: null,
  };
}

/** True while at least one of the two members still has a live plan. */
export function pairPlanLive(viewerLive?: boolean | null, otherLive?: boolean | null): boolean {
  return Boolean(viewerLive) || Boolean(otherLive);
}

/** Free (welcome / no plan) viewers get the full paid profile when interest is open and a plan is still live. */
export function complimentaryPaidProfileAccess(input: {
  viewerKind?: MembershipKind | null;
  targetKind?: MembershipKind | null;
  interestOpen?: boolean;
  pairLive?: boolean;
}): boolean {
  if (input.pairLive === false) return false;
  if (!input.interestOpen) return false;
  if (input.targetKind !== "paid") return false;
  return input.viewerKind === "none" || input.viewerKind === "welcome";
}
