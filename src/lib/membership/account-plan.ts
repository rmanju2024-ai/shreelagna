import type { Membership } from "@/lib/membership/access";
import { formatIstDate } from "@/lib/time/ist";

export type PlanMark = { id: string; icon: string; text: string; tone: "live" | "wait" | "soft" };

export function planHeaderMarks(input: {
  access: Pick<Membership, "kind" | "live" | "label" | "daysLeft" | "until">;
  pendingName?: string | null;
  used: number;
  limit: number | null;
}): PlanMark[] {
  const { access } = input;
  const name =
    access.kind === "welcome"
      ? "Gift"
      : access.kind === "none"
        ? "No plan"
        : access.kind === "house"
          ? "House"
          : access.label.replace(/\s+plan$/i, "");
  const marks: PlanMark[] = [{ id: "plan", icon: "✦", text: name, tone: access.live ? "live" : "wait" }];
  if (input.pendingName) marks.push({ id: "wait", icon: "◎", text: input.pendingName, tone: "wait" });
  else if (!access.live) marks.push({ id: "wait", icon: "◎", text: "Wait", tone: "wait" });
  if (access.kind !== "house") {
    marks.push({
      id: "days",
      icon: "☽",
      text: `${access.live ? access.daysLeft : 0}d`,
      tone: "soft",
    });
    if (access.until) {
      marks.push({ id: "end", icon: "▣", text: formatIstDate(access.until, false), tone: "soft" });
    }
  }
  marks.push({
    id: "use",
    icon: "✉",
    text: input.limit == null ? "∞" : `${input.used}/${input.limit}`,
    tone: "soft",
  });
  return marks;
}
