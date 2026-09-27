"use server";

import { requireDesk } from "@/lib/desk/access";
import { writeAudit } from "@/lib/desk/audit";
import { createServiceClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

function refresh() {
  revalidatePath("/desk/staff");
  revalidatePath("/desk/analytics", "layout");
}

export async function appointStaff(formData: FormData) {
  const desk = await requireDesk("/desk/staff");
  if (!desk.allowed || !desk.admin) return;
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email) return;
  const db = createServiceClient() ?? desk.supabase;
  const { data: row } = await db.from("app_users").select("id, role, email").eq("email", email).maybeSingle();
  if (!row || row.role === "admin" || row.id === desk.me?.id) return;
  await db.from("app_users").update({ role: "service" }).eq("id", row.id);
  await writeAudit({
    actorUserId: desk.me?.id,
    actorRole: desk.me?.role,
    action: "staff.appoint",
    entityType: "user",
    entityId: row.id,
    metadata: { email: row.email },
  });
  refresh();
}

export async function removeStaff(formData: FormData) {
  const desk = await requireDesk("/desk/staff");
  if (!desk.allowed || !desk.admin) return;
  const id = String(formData.get("id") ?? "");
  if (!id || id === desk.me?.id) return;
  const db = createServiceClient() ?? desk.supabase;
  const { data: row } = await db.from("app_users").select("id, role, email").eq("id", id).maybeSingle();
  if (!row || row.role !== "service") return;
  await db.from("app_users").update({ role: "member" }).eq("id", row.id);
  await writeAudit({
    actorUserId: desk.me?.id,
    actorRole: desk.me?.role,
    action: "staff.remove",
    entityType: "user",
    entityId: row.id,
    metadata: { email: row.email },
  });
  refresh();
}
