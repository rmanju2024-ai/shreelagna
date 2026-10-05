import type { SupabaseClient } from "@supabase/supabase-js";
import { extrasFromMedia, isMandatoryReadyFromRecord } from "@/lib/profile/completeness";

export async function loadHouseReady(
  supabase: SupabaseClient,
  profileId: string,
  emailOtpVerified: boolean,
) {
  const [{ data: row }, { data: media }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", profileId).maybeSingle(),
    supabase.from("media").select("kind, status").eq("profile_id", profileId),
  ]);
  if (!row) return null;
  const ready = isMandatoryReadyFromRecord(
    row as Record<string, unknown>,
    extrasFromMedia(media ?? [], emailOtpVerified),
  );
  if (Boolean(row.is_complete) !== ready) {
    await supabase.from("profiles").update({ is_complete: ready }).eq("id", profileId);
  }
  return {
    id: String(row.id),
    status: typeof row.status === "string" ? row.status : null,
    subject_full_name: typeof row.subject_full_name === "string" ? row.subject_full_name : null,
    ready,
  };
}

export function viewerEmailVerified(me: { email?: string | null; email_otp_verified_at?: string | null }) {
  return Boolean(me.email_otp_verified_at || me.email);
}
