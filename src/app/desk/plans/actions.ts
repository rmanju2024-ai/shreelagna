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

type AnyDb = {
  from: (table: string) => {
    select: (cols: string) => {
      eq: (col: string, value: string) => {
        maybeSingle: () => Promise<{ data: Record<string, unknown> | null }>;
      };
    };
    update: (row: Record<string, unknown>) => {
      eq: (col: string, value: string) => PromiseLike<unknown> & {
        eq: (col: string, value: string) => PromiseLike<unknown>;
      };
      neq: (col: string, value: string) => PromiseLike<unknown>;
    };
    insert: (row: Record<string, unknown>) => {
      select: (cols: string) => { maybeSingle: () => Promise<{ data: Record<string, unknown> | null }> };
    };
  };
};

function asDb(db: unknown): AnyDb {
  return db as AnyDb;
}

async function activateRow(
  db: AnyDb,
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
  const db = asDb(createServiceClient() ?? desk.supabase);
  const { data: row } = await db
    .from("memberships")
    .select("id, user_id, plan_code, status")
    .eq("id", id)
    .maybeSingle();
  if (!row || row.status !== "pending") return;
  const planCode = String(row.plan_code ?? "");
  const userId = String(row.user_id ?? "");
  const rowId = String(row.id ?? "");
  const plan = await fetchPlanByCode(db, planCode);
  const months = plan?.months ?? 3;
  await activateRow(db, { id: rowId, user_id: userId, plan_code: planCode }, desk.me?.id, months);
  await writeAudit({
    actorUserId: desk.me?.id,
    actorRole: desk.me?.role,
    action: "membership.confirm",
    entityType: "membership",
    entityId: rowId,
    metadata: { plan: planCode, user: userId },
  });
  const ends = addMonths(new Date(), months);
  await notifyPlanActivated(userId, plan?.name ?? planCode, ends);
  refresh();
}

export async function declinePlan(formData: FormData) {
  const desk = await requireDesk("/desk/plans");
  if (!desk.allowed) return;
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const db = asDb(createServiceClient() ?? desk.supabase);
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
  const db = asDb(createServiceClient() ?? desk.supabase);
  const plan = isPlanCode(code) ? await fetchPlanByCode(db, code) : null;
  if (!email || !plan) return;
  const { data: member } = await db.from("app_users").select("id, role, email").eq("email", email).maybeSingle();
  if (!member || member.role === "admin") return;
  const memberId = String(member.id ?? "");
  await db.from("memberships").update({ status: "cancelled" }).eq("user_id", memberId).eq("status", "pending");
  const { data: inserted } = await db
    .from("memberships")
    .insert({
      user_id: memberId,
      plan_code: code,
      source: "grant",
      status: "pending",
    })
    .select("id, user_id, plan_code")
    .maybeSingle();
  if (!inserted?.id) return;
  await activateRow(
    db,
    { id: String(inserted.id), user_id: String(inserted.user_id ?? memberId), plan_code: String(inserted.plan_code ?? code) },
    desk.me?.id,
    plan.months,
  );
  await writeAudit({
    actorUserId: desk.me?.id,
    actorRole: desk.me?.role,
    action: "membership.grant",
    entityType: "membership",
    entityId: String(inserted.id),
    metadata: { plan: code, email: String(member.email ?? "") },
  });
  await notifyPlanActivated(memberId, plan.name, addMonths(new Date(), plan.months));
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
  const db = asDb(createServiceClient() ?? desk.supabase);
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
  const db = asDb(createServiceClient() ?? desk.supabase);
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
