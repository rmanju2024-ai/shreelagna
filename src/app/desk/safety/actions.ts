"use server";

import { requireDesk } from "@/lib/desk/access";
import { writeAudit } from "@/lib/desk/audit";
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
  const { error } = await db.from("safety_reports").update({
    status,
    staff_note: staffNote || null,
    reviewed_by: desk.me?.id ?? null,
    reviewed_at: ["resolved", "dismissed"].includes(status) ? new Date().toISOString() : null,
  }).eq("id", id);
  if (!error) {
    await writeAudit({
      actorUserId: desk.me?.id,
      actorRole: desk.me?.role,
      action: "safety.case.review",
      entityType: "safety_report",
      entityId: id,
      metadata: { status },
    });
    refreshDesk(["/desk/safety", "/desk/analytics"]);
  }
}
