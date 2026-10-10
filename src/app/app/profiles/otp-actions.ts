"use server";

import { ensureAppUser } from "@/lib/auth/session";
import { digitsCode, hashOtp, makeOtpCode, OTP_RESEND_MS, OTP_TTL_MS, otpExpired, otpMatches } from "@/lib/notify/otp";
import { toWhatsAppNumber } from "@/lib/notify/phone";
import { notifyConfigured, sendChannelOtp } from "@/lib/notify/channel";
import { isUniqueViolation, missingPayloadColumn } from "@/lib/profile/db-errors";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { readSessionFromCookies } from "@/lib/supabase/user-rest";
import { revalidatePath } from "next/cache";

export type OtpActionResult = { ok: true; preview?: string } | { ok: false; error: string };

async function memberDb() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in again." };
  const cookieSession = await readSessionFromCookies();
  if (cookieSession) await supabase.auth.setSession(cookieSession);
  const me = await ensureAppUser(supabase, user);
  if (!me) return { error: "Sign in again." };
  return { db: createServiceClient() ?? supabase, me };
}

export async function sendMobileOtp(profileId: string, mobileRaw: string): Promise<OtpActionResult> {
  const auth = await memberDb();
  if ("error" in auth) return { ok: false, error: String(auth.error ?? "Sign in again.") };
  const { db, me } = auth;
  const { data: profile } = await db
    .from("profiles")
    .select("id, created_by")
    .eq("id", profileId)
    .eq("created_by", me.id)
    .maybeSingle();
  if (!profile) return { ok: false, error: "Save the profile first, then confirm mobile." };
  const mobile = toWhatsAppNumber(mobileRaw);
  if (!mobile) return { ok: false, error: "Enter a 10-digit Indian mobile." };

  const { data: latest } = await db
    .from("whatsapp_otps")
    .select("created_at")
    .eq("user_id", me.id)
    .eq("purpose", "verify_mobile")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (latest?.created_at && Date.now() - Date.parse(latest.created_at) < OTP_RESEND_MS) {
    return { ok: false, error: "Wait a minute before requesting another code." };
  }

  const code = makeOtpCode();
  const { error: insertError } = await db.from("whatsapp_otps").insert({
    user_id: me.id,
    profile_id: profile.id,
    mobile,
    code_hash: hashOtp(mobile, code),
    purpose: "verify_mobile",
    expires_at: new Date(Date.now() + OTP_TTL_MS).toISOString(),
  });
  if (insertError) return { ok: false, error: "Ask house to run SQL 053, then try again." };

  if (!notifyConfigured()) {
    if (process.env.NODE_ENV === "production") return { ok: false, error: "Arattai is not configured yet." };
    return { ok: true, preview: code };
  }

  const sent = await sendChannelOtp(mobile, code);
  if (!sent.ok) {
    if (process.env.NODE_ENV === "production") return { ok: false, error: sent.error };
    return { ok: true, preview: code };
  }
  return { ok: true };
}

export async function verifyMobileOtp(
  profileId: string,
  mobileRaw: string,
  codeRaw: string,
): Promise<OtpActionResult> {
  const auth = await memberDb();
  if ("error" in auth) return { ok: false, error: String(auth.error ?? "Sign in again.") };
  const { db, me } = auth;
  const { data: profile } = await db
    .from("profiles")
    .select("id, created_by")
    .eq("id", profileId)
    .eq("created_by", me.id)
    .maybeSingle();
  if (!profile) return { ok: false, error: "Save the profile first, then confirm mobile." };
  const mobile = toWhatsAppNumber(mobileRaw);
  const code = digitsCode(codeRaw);
  if (!mobile || code.length !== 6) return { ok: false, error: "Enter the 6-digit Arattai code." };

  const { data: row } = await db
    .from("whatsapp_otps")
    .select("id, code_hash, expires_at, mobile")
    .eq("user_id", me.id)
    .eq("profile_id", profile.id)
    .eq("mobile", mobile)
    .eq("purpose", "verify_mobile")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!row || otpExpired(row.expires_at) || !otpMatches(mobile, code, row.code_hash)) {
    return { ok: false, error: "That code is wrong or has expired." };
  }

  const display = mobile.startsWith("91") && mobile.length === 12 ? mobile.slice(2) : mobile;
  const payload: Record<string, unknown> = {
    subject_mobile: display,
    phone_otp_verified_at: new Date().toISOString(),
    trust_tier: "mobile_confirmed",
  };
  let { error } = await db
    .from("profiles")
    .update(payload)
    .eq("id", profile.id)
    .eq("created_by", me.id);
  if (error && missingPayloadColumn(error, payload)) {
    delete payload.trust_tier;
    const retry = await db.from("profiles").update(payload).eq("id", profile.id).eq("created_by", me.id);
    error = retry.error;
  }
  if (error) {
    if (isUniqueViolation(error)) return { ok: false, error: "This mobile is already confirmed on another profile." };
    return { ok: false, error: "Could not save the confirmed mobile." };
  }

  await db.from("whatsapp_otps").delete().eq("user_id", me.id).eq("purpose", "verify_mobile");
  revalidatePath(`/app/profiles/${profile.id}`);
  revalidatePath("/app/settings");
  return { ok: true };
}
