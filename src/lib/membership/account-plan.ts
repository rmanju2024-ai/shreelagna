import type { Membership } from "@/lib/membership/access";

export function planWaitingLine(input: { live: boolean; pendingName?: string | null }): string {
  if (input.pendingName) return `Waiting for ${input.pendingName} to be activated.`;
  if (!input.live) return "Waiting for a live plan.";
  return "Nothing waiting.";
}

export function planQuotaLine(quota: { used: number; limit: number | null }): string {
  if (quota.limit == null) return "Chat & requests: no cap on this cover.";
  return `Chat & requests: ${quota.used} used of ${quota.limit}.`;
}

export function planDaysLine(access: Pick<Membership, "live" | "daysLeft" | "kind">): string {
  if (access.kind === "house") return "House cover has no end date.";
  if (!access.live) return "0 days left.";
  return `${access.daysLeft} ${access.daysLeft === 1 ? "day" : "days"} left.`;
}
