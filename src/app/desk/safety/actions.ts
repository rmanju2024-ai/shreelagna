"use server";

import { requireDesk } from "@/lib/desk/access";
import { writeAudit } from "@/lib/desk/audit";
import { orderedProfilePair, parseSafetyEnforce } from "@/lib/desk/safety-actions";
import { createServiceClient } from "@/lib/supabase/server";
import { refreshDesk } from "@/lib/desk/refresh";

export async function updateSafetyCase(formData: FormData) {
  const desk = await requireDesk("/desk/safety");
  if (!desk.allowed) return;
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  const staffNote = String(formData.get("staff_note") ?? "").trim().slice(0, 2000);
  if (!id || !["new", "in_review", "resolved", "dismissed"].includes(status)) return;
  const db = createServiceClient() ?? desk.supabase;
  const { data: report } = await db
    .from("safety_reports")
    .select("id, reporter_profile_id, reported_profile_id")
    .eq("id", id)
    .maybeSingle();
  const { error } = await db.from("safety_reports").update({
    status,
    staff_note: staffNote || null,
    reviewed_by: desk.me?.id ?? null,
    reviewed_at: ["resolved", "dismissed"].includes(status) ? new Date().toISOString() : null,
  }).eq("id", id);
  const enforce = parseSafetyEnforce({
    hide: formData.get("hide_profile"),
    block: formData.get("block_both"),
    freeze: formData.get("freeze_chat"),
  });
  if (!error && report && (status === "resolved" || status === "in_review")) {
    const reported = String(report.reported_profile_id);
    const reporter = String(report.reporter_profile_id);
    if (enforce.hide && reported) {
      await db.from("profiles").update({ status: "hidden" }).eq("id", reported).neq("status", "banned");
    }
    if (enforce.block && reported && reporter) {
      await db.from("member_blocks").upsert(
        [
          { blocker_profile_id: reporter, blocked_profile_id: reported },
          { blocker_profile_id: reported, blocked_profile_id: reporter },
        ],
        { onConflict: "blocker_profile_id,blocked_profile_id", ignoreDuplicates: true },
      );
    }
    if (enforce.freeze && reported && reporter) {
      const [a, b] = orderedProfilePair(reporter, reported);
      await db.from("threads").update({ frozen: true }).eq("profile_a", a).eq("profile_b", b);
    }
  }
  if (!error) {
    await writeAudit({
      actorUserId: desk.me?.id,
      actorRole: desk.me?.role,
      action: "safety.case.review",
      entityType: "safety_report",
      entityId: id,
      metadata: { status, ...enforce },
    });
    refreshDesk(["/desk/safety", "/desk/analytics", "/desk/profiles", "/app/chat"]);
  }
}
