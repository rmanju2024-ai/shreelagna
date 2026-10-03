"use server";

import { requireDesk } from "@/lib/desk/access";
import { writeAudit } from "@/lib/desk/audit";
import { createServiceClient } from "@/lib/supabase/server";
import { refreshDesk } from "@/lib/desk/refresh";

const STATES = ["in_review", "approved", "rejected", "expired"] as const;

export async function reviewVerificationCase(formData: FormData) {
  const desk = await requireDesk("/desk/verification");
  // Document-based approvals are restricted to admins, not general staff.
  if (!desk.allowed || !desk.admin) return;
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  const note = String(formData.get("note") ?? "").trim().slice(0, 500);
  if (!id || !STATES.includes(status as (typeof STATES)[number])) return;
  if (status === "rejected" && !note) return;
  const db = createServiceClient() ?? desk.supabase;
  const reviewedAt = ["approved", "rejected", "expired"].includes(status) ? new Date().toISOString() : null;
  const payload = {
    status,
    reviewer_user_id: desk.me?.id,
    review_note: note || null,
    rejection_reason: status === "rejected" ? note : null,
    reviewed_at: reviewedAt,
    recheck_due_at: status === "approved" ? new Date(Date.now() + 730 * 24 * 60 * 60 * 1000).toISOString() : null,
    updated_at: new Date().toISOString(),
  };
  const { data: item, error } = await db.from("profile_verification_cases").update(payload).eq("id", id).select("profile_id, document_type").maybeSingle();
  if (error || !item) return;
  if (status === "approved" && item.document_type === "identity") {
    await db.from("profiles").update({ trust_tier: "identity_checked" }).eq("id", item.profile_id);
  }
  await writeAudit({ actorUserId: desk.me?.id, actorRole: desk.me?.role, action: "verification.case.review", entityType: "verification_case", entityId: id, metadata: { status, documentType: item.document_type } });
  refreshDesk(["/desk/verification", "/desk/profiles"]);
}
