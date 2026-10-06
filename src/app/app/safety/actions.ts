"use server";

import { ensureAppUser } from "@/lib/auth/session";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const CATEGORIES = new Set(["fake_profile", "harassment", "money_request", "inappropriate_content", "marital_status", "other"]);

async function member() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/app/safety");
  const me = await ensureAppUser(supabase, user);
  if (!me?.active_profile_id) redirect("/app");
  return { db: createServiceClient() ?? supabase, me };
}

export async function blockProfile(formData: FormData) {
  const { db, me } = await member();
  const targetId = String(formData.get("profile_id") ?? "");
  if (!targetId || targetId === me.active_profile_id) redirect("/browse");
  const { error } = await db.from("member_blocks").upsert(
    { blocker_profile_id: me.active_profile_id, blocked_profile_id: targetId },
    { onConflict: "blocker_profile_id,blocked_profile_id", ignoreDuplicates: true },
  );
  if (error) return { ok: false as const, error: "Could not block this profile just now. Please try again." };
  revalidatePath("/browse");
  revalidatePath("/app/interests");
  revalidatePath("/app/chat");
  revalidatePath(`/browse/${targetId}`);
  return { ok: true as const };
}

export async function reportProfile(formData: FormData) {
  const { db, me } = await member();
  const targetId = String(formData.get("profile_id") ?? "");
  const category = String(formData.get("category") ?? "");
  const details = String(formData.get("details") ?? "").trim().slice(0, 2000);
  const returnTo = String(formData.get("return_to") ?? "/browse");
  if (!targetId || targetId === me.active_profile_id || !CATEGORIES.has(category)) {
    redirect(`${returnTo}?safety=report_error`);
  }
  const { error } = await db.from("safety_reports").insert({
    reporter_profile_id: me.active_profile_id,
    reported_profile_id: targetId,
    category,
    details: details || null,
  });
  if (error && !error.message.toLowerCase().includes("duplicate")) {
    redirect(`${returnTo}?safety=report_error`);
  }
  revalidatePath("/app/safety");
  redirect(`${returnTo}?safety=reported`);
}

export async function unblockProfile(formData: FormData) {
  const { db, me } = await member();
  const targetId = String(formData.get("profile_id") ?? "");
  const returnTo = String(formData.get("return_to") ?? "/app/blocked");
  if (!targetId) redirect("/app/blocked");
  const { error } = await db
    .from("member_blocks")
    .delete()
    .eq("blocker_profile_id", me.active_profile_id)
    .eq("blocked_profile_id", targetId);
  revalidatePath("/app/blocked");
  revalidatePath("/browse");
  redirect(`${returnTo}${returnTo.includes("?") ? "&" : "?"}safety=${error ? "unblock_error" : "unblocked"}`);
}
