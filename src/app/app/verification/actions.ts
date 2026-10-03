"use server";

import { ensureAppUser, getAuth } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";

export async function requestVerification(formData: FormData) {
  const type = String(formData.get("document_type") ?? "");
  if (!["identity", "education", "employment"].includes(type)) return;
  const { supabase, user } = await getAuth();
  if (!supabase || !user) return;
  const me = await ensureAppUser(supabase, user);
  if (!me?.active_profile_id) return;
  await supabase.from("profile_verification_cases").insert({ profile_id: me.active_profile_id, requested_by: me.id, document_type: type });
  revalidatePath("/app/verification");
}
