import { createClient, createServiceClient } from "@/lib/supabase/server";

export async function writeAudit(input: {
  actorUserId?: string | null;
  actorRole?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
}) {
  try {
    const db = createServiceClient() ?? (await createClient());
    const role = input.actorRole === "admin" || input.actorRole === "service" || input.actorRole === "member"
      ? input.actorRole
      : null;
    await db.from("audit_events").insert({
      actor_user_id: input.actorUserId ?? null,
      actor_role: role,
      action: input.action,
      entity_type: input.entityType,
      entity_id: input.entityId ?? null,
      metadata: input.metadata ?? {},
    });
  } catch {
    /* audit is best-effort */
  }
}
