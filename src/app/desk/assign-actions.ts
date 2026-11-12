"use server";

import { requireDesk } from "@/lib/desk/access";
import { writeAudit } from "@/lib/desk/audit";
import { defaultDueIso } from "@/lib/desk/sla";
import { missingPayloadColumn } from "@/lib/profile/db-errors";
import { refreshDesk } from "@/lib/desk/refresh";
import { createServiceClient } from "@/lib/supabase/server";

const TABLES = {
  ticket: { table: "tickets", path: "/desk/tickets" },
  safety: { table: "safety_reports", path: "/desk/safety" },
  verification: { table: "profile_verification_cases", path: "/desk/verification" },
} as const;

export async function assignDeskWork(formData: FormData) {
  const desk = await requireDesk();
  if (!desk.allowed) return;
  const kind = String(formData.get("kind") ?? "") as keyof typeof TABLES;
  const id = String(formData.get("id") ?? "");
  const assigned = String(formData.get("assigned_to") ?? "").trim();
  const claim = String(formData.get("claim") ?? "") === "1";
  if (!id || !(kind in TABLES)) return;
  const target = TABLES[kind];
  if (kind === "verification" && !desk.admin) return;
  const db = createServiceClient() ?? desk.supabase;
  const assignedTo = claim ? desk.me?.id ?? null : assigned || null;
  const payload: Record<string, unknown> = {
    assigned_to: assignedTo,
    due_at: assignedTo ? defaultDueIso() : null,
  };
  let { error } = await db.from(target.table).update(payload).eq("id", id);
  while (error) {
    const missing = missingPayloadColumn(error, payload);
    if (!missing) break;
    delete payload[missing];
    ({ error } = await db.from(target.table).update(payload).eq("id", id));
  }
  if (!error) {
    await writeAudit({
      actorUserId: desk.me?.id,
      actorRole: desk.me?.role,
      action: `${kind}.assign`,
      entityType: kind,
      entityId: id,
      metadata: { assignedTo, claim },
    });
  }
  refreshDesk([target.path]);
}
