"use server";

import { ensureAppUser } from "@/lib/auth/session";
import { writeAudit } from "@/lib/desk/audit";
import { isPlanCode } from "@/lib/membership/catalog";
import { fetchPlanByCode } from "@/lib/membership/load";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function refresh() {
  revalidatePath("/app/plans");
  revalidatePath("/browse");
  revalidatePath("/", "layout");
}

export async function requestPlan(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/app/plans");
  const me = await ensureAppUser(supabase, user);
  if (!me) redirect("/login?error=account");
  if (me.role === "admin" || me.role === "service") redirect("/app/plans");

  const code = String(formData.get("plan") ?? "");
  const db = createServiceClient() ?? supabase;
  const plan = isPlanCode(code) ? await fetchPlanByCode(db, code) : null;
  if (!plan?.forSale) redirect("/app/plans");

  const { data: pending } = await db
    .from("memberships")
    .select("id")
    .eq("user_id", me.id)
    .eq("status", "pending")
    .maybeSingle();

  if (pending?.id) {
    await db.from("memberships").update({ plan_code: code }).eq("id", pending.id);
  } else {
    const { error } = await db.from("memberships").insert({
      user_id: me.id,
      plan_code: code,
      source: "request",
      status: "pending",
    });
    if (error) redirect("/app/plans?error=request");
  }

  await writeAudit({
    actorUserId: me.id,
    actorRole: me.role,
    action: "membership.request",
    entityType: "membership",
    metadata: { plan: code },
  });
  refresh();
  redirect("/app/plans?requested=1");
}
