"use server";

import { requireDesk } from "@/lib/desk/access";
import { writeAudit } from "@/lib/desk/audit";
import { parseMediaRejectReason } from "@/lib/desk/media-review";
import { refreshDesk } from "@/lib/desk/refresh";
import { createServiceClient } from "@/lib/supabase/server";
import { missingPayloadColumn } from "@/lib/profile/db-errors";

async function afterMedia(profileId: string) {
  refreshDesk(["/desk/media", "/desk/profiles", `/app/profiles/${profileId}`, "/browse"]);
}

export async function reviewMediaItem(formData: FormData) {
  const desk = await requireDesk("/desk/media");
  if (!desk.allowed) return;
  const id = String(formData.get("id") ?? "");
  const decision = String(formData.get("decision") ?? "");
  const reason = parseMediaRejectReason(formData.get("reason"));
  if (!id || (decision !== "approved" && decision !== "rejected" && decision !== "pending")) return;
  if (decision === "rejected" && !reason) return;
  const db = createServiceClient() ?? desk.supabase;
  const { data: row } = await db.from("media").select("id, profile_id, kind, status").eq("id", id).maybeSingle();
  if (!row?.id) return;
  const payload: Record<string, unknown> = {
    status: decision,
    review_reason: decision === "rejected" ? reason : null,
  };
  let { error } = await db.from("media").update(payload).eq("id", id);
  while (error) {
    const missing = missingPayloadColumn(error, payload);
    if (!missing) break;
    delete payload[missing];
    ({ error } = await db.from("media").update(payload).eq("id", id));
  }
  if (error) return;
  if (decision === "rejected" && row.kind === "photo") {
    const { data: photos } = await db
      .from("media")
      .select("id, status")
      .eq("profile_id", row.profile_id)
      .eq("kind", "photo");
    const live = (photos ?? []).some((item) => item.status === "approved" && item.id !== id);
    if (!live) {
      await db.from("profiles").update({ status: "on_hold" }).eq("id", row.profile_id).neq("status", "banned");
    }
  }
  await writeAudit({
    actorUserId: desk.me?.id,
    actorRole: desk.me?.role,
    action: "media.review",
    entityType: "media",
    entityId: id,
    metadata: { decision, reason, kind: row.kind, profile: row.profile_id },
  });
  await afterMedia(String(row.profile_id));
}
