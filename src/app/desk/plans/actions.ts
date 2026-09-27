"use server";

import { requireDesk } from "@/lib/desk/access";
import { writeAudit } from "@/lib/desk/audit";
import { notifyPlanActivated } from "@/lib/notify/dispatch";
import { isPlanCode, readPlanForm } from "@/lib/membership/catalog";
import { fetchPlanByCode } from "@/lib/membership/load";
import { createServiceClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

function refresh() {
  revalidatePath("/desk/plans");
  revalidatePath("/app/plans");
  revalidatePath("/", "layout");
}

function addMonths(from: Date, months: number) {
  const next = new Date(from.getTime());
  next.setUTCMonth(next.getUTCMonth() + months);
  return next;
}

type Store = {
  from: (table: string) => {
    update: (row: Record<string, unknown>) => {
      eq: (
        col: string,
        value: string,
      ) => PromiseLike<unknown> & { eq: (col: string, value: string) => PromiseLike<unknown> };
    };
    neq?: (col: string, value: string) => PromiseLike<unknown>;
  };
};

async function activateRow(
  db: Store,
  row: { id: string; user_id: string; plan_code: string },
  actorId: string | undefined,
  months: number,
) {
  const starts = new Date();
  const ends = addMonths(starts, months);
  await db.from("memberships").update({ status: "cancelled" }).eq("user_id", row.user_id).eq("status", "active");
  await db.from("memberships").update({
    status: "active",
    starts_at: starts.toISOString(),
    ends_at: ends.toISOString(),
    activated_at: starts.toISOString(),
    activated_by: actorId ?? null,
  }).eq("id", row.id);
}

export async function confirmPlan(formData: FormData) {
  const desk = await requireDesk("/desk/plans");
  if (!desk.allowed) return;
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const db = createServiceClient() ?? desk.supabase;
  const { data: row } = await db
    .from("memberships")
    .select("id, user_id, plan_code, status")
    .eq("id", id)
    .maybeSingle();
  if (!row || row.status !== "pending") return;
  const plan = await fetchPlanByCode(db, row.plan_code);
  const months = plan?.months ?? 3;
  await activateRow(db as Store, row, desk.me?.id, months);
  await writeAudit({
    actorUserId: desk.me?.id,
    actorRole: desk.me?.role,
    action: "membership.confirm",
    entityType: "membership",
    entityId: row.id,
    metadata: { plan: row.plan_code, user: row.user_id },
  });
  const ends = addMonths(new Date(), months);
  await notifyPlanActivated(row.user_id, plan?.name ?? row.plan_code, ends);
  refresh();
}

export async function declinePlan(formData: FormData) {
  const desk = await requireDesk("/desk/plans");
  if (!desk.allowed) return;
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const db = createServiceClient() ?? desk.supabase;
  await db.from("memberships").update({ status: "cancelled" }).eq("id", id).eq("status", "pending");
  await writeAudit({
    actorUserId: desk.me?.id,
    actorRole: desk.me?.role,
    action: "membership.decline",
    entityType: "membership",
    entityId: id,
  });
  refresh();
}

export async function grantPlan(formData: FormData) {
  const desk = await requireDesk("/desk/plans");
  if (!desk.allowed) return;
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const code = String(formData.get("plan") ?? "");
  const db = createServiceClient() ?? desk.supabase;
  const plan = isPlanCode(code) ? await fetchPlanByCode(db, code) : null;
  if (!email || !plan) return;
  const { data: member } = await db.from("app_users").select("id, role, email").eq("email", email).maybeSingle();
  if (!member || member.role === "admin") return;
  await db.from("memberships").update({ status: "cancelled" }).eq("user_id", member.id).eq("status", "pending");
  const { data: inserted } = await db
    .from("memberships")
    .insert({
      user_id: member.id,
      plan_code: code,
      source: "grant",
      status: "pending",
    })
    .select("id, user_id, plan_code")
    .maybeSingle();
  if (!inserted) return;
  await activateRow(db as Store, inserted, desk.me?.id, plan.months);
  await writeAudit({
    actorUserId: desk.me?.id,
    actorRole: desk.me?.role,
    action: "membership.grant",
    entityType: "membership",
    entityId: inserted.id,
    metadata: { plan: code, email: member.email },
  });
  await notifyPlanActivated(member.id, plan.name, addMonths(new Date(), plan.months));
  refresh();
}

function planPayload(plan: {
  name: string;
  tagline: string;
  months: number;
  priceInr: number;
  featured: boolean;
  forSale: boolean;
  sortOrder: number;
  interestLimit: number;
  perks: string[];
}) {
  return {
    name: plan.name,
    tagline: plan.tagline,
    months: plan.months,
    price_inr: plan.priceInr,
    featured: plan.featured,
    for_sale: plan.forSale,
    sort_order: plan.sortOrder,
    interest_limit: plan.interestLimit,
    perks: plan.perks,
  };
}

export async function savePlan(formData: FormData) {
  const desk = await requireDesk("/desk/plans");
  if (!desk.allowed || !desk.admin) return;
  const plan = readPlanForm(formData, String(formData.get("code") ?? ""));
  if (!plan) return;
  const db = createServiceClient() ?? desk.supabase;
  if (plan.featured) {
    await db.from("member_plans").update({ featured: false }).neq("code", plan.code);
  }
  await db.from("member_plans").update(planPayload(plan)).eq("code", plan.code);
  await writeAudit({
    actorUserId: desk.me?.id,
    actorRole: desk.me?.role,
    action: "plan.save",
    entityType: "plan",
    entityId: plan.code,
    metadata: { name: plan.name, months: plan.months, price: plan.priceInr },
  });
  refresh();
}

export async function addPlan(formData: FormData) {
  const desk = await requireDesk("/desk/plans");
  if (!desk.allowed || !desk.admin) return;
  const plan = readPlanForm(formData);
  if (!plan) return;
  const db = createServiceClient() ?? desk.supabase;
  const { data: existing } = await db.from("member_plans").select("code").eq("code", plan.code).maybeSingle();
  if (existing) return;
  if (plan.featured) {
    await db.from("member_plans").update({ featured: false }).neq("code", plan.code);
  }
  await db.from("member_plans").insert({ code: plan.code, ...planPayload(plan) });
  await writeAudit({
    actorUserId: desk.me?.id,
    actorRole: desk.me?.role,
    action: "plan.add",
    entityType: "plan",
    entityId: plan.code,
    metadata: { name: plan.name },
  });
  refresh();
}
