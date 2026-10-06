import type { Membership } from "@/lib/membership/access";
import { WELCOME_PLAN_NAME } from "@/lib/membership/catalog";
import { formatIstDate } from "@/lib/time/ist";

export type PlanMark = {
  id: string;
  text: string;
  hint: string;
  tone: "live" | "wait" | "soft";
};

export function planHeaderMarks(input: {
  access: Pick<Membership, "kind" | "live" | "label" | "daysLeft" | "until">;
  pendingName?: string | null;
  used: number;
  limit: number | null;
}): PlanMark[] {
  const { access } = input;
  const name =
    access.kind === "welcome"
      ? WELCOME_PLAN_NAME
      : access.kind === "none"
        ? "No plan"
        : access.kind === "house"
          ? "House"
          : access.label.replace(/\s+plan$/i, "");
  const marks: PlanMark[] = [{ id: "plan", text: name, hint: "Name", tone: access.live ? "live" : "wait" }];
  if (input.pendingName) marks.push({ id: "wait", text: input.pendingName, hint: "Waiting", tone: "wait" });
  else if (!access.live) marks.push({ id: "wait", text: "A live plan", hint: "Waiting", tone: "wait" });
  if (access.kind !== "house") {
    marks.push({
      id: "days",
      text: `${access.live ? access.daysLeft : 0}d`,
      hint: "Days left",
      tone: "soft",
    });
    if (access.until) {
      marks.push({ id: "end", text: formatIstDate(access.until, false), hint: "Expiry date", tone: "soft" });
    }
  }
  marks.push({
    id: "use",
    text: input.limit == null ? "Open" : `${input.used}/${input.limit}`,
    hint: "Chat counter",
    tone: "soft",
  });
  return marks;
}
