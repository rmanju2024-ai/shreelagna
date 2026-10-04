"use server";

import { ensureAppUser, getAuth } from "@/lib/auth/session";
import {
  EVIDENCE_BUCKET,
  EVIDENCE_MAX_BYTES,
  EVIDENCE_MAX_FILES,
  EVIDENCE_TYPES,
  evidenceFolder,
  evidenceStore,
} from "@/lib/verification/evidence";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

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

export async function uploadVerificationEvidence(formData: FormData) {
  const caseId = String(formData.get("case_id") ?? "");
  const file = formData.get("file");
  const back = (code: string) => redirect(`/app/verification?upload=${code}`);
  if (!caseId || !(file instanceof File) || !file.size) return back("missing");
  if (!EVIDENCE_TYPES[file.type]) return back("type");
  if (file.size > EVIDENCE_MAX_BYTES) return back("size");
  const { supabase, user } = await getAuth();
  if (!supabase || !user) return back("auth");
  const me = await ensureAppUser(supabase, user);
  if (!me) return back("auth");
  // Only the member's own, still-open request may receive a document.
  const { data: item } = await supabase
    .from("profile_verification_cases")
    .select("id, profile_id, status")
    .eq("id", caseId)
    .eq("requested_by", me.id)
    .maybeSingle();
  if (!item || !["requested", "in_review", "appealed"].includes(item.status)) return back("closed");
  const store = await evidenceStore();
  if (!store) return back("storage");
  const folder = evidenceFolder(item.profile_id, item.id);
  const existing = await store.storage.from(EVIDENCE_BUCKET).list(folder);
  if ((existing.data?.length ?? 0) >= EVIDENCE_MAX_FILES) return back("limit");
  const path = `${folder}/${Date.now()}.${EVIDENCE_TYPES[file.type]}`;
  const { error } = await store.storage.from(EVIDENCE_BUCKET).upload(path, Buffer.from(await file.arrayBuffer()), {
    contentType: file.type,
    upsert: false,
  });
  if (error) return back("storage");
  await store.from("profile_verification_cases").update({ status: "in_review", updated_at: new Date().toISOString() }).eq("id", item.id).eq("status", "requested");
  revalidatePath("/app/verification");
  return back("ok");
}
