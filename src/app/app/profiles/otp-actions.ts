"use server";

import { ensureAppUser } from "@/lib/auth/session";
import { digitsCode, hashOtp, makeOtpCode, OTP_RESEND_MS, OTP_TTL_MS, otpExpired, otpMatches } from "@/lib/notify/otp";
import { toArattaiMobile } from "@/lib/notify/arattai";
import { channelOperatorHint, notifyConfigured, sendChannelOtp } from "@/lib/notify/channel";
import { isUniqueViolation, missingPayloadColumn } from "@/lib/profile/db-errors";
import { findProfileUsingMobile, MOBILE_IN_USE } from "@/lib/profile/mobile-unique";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { readSessionFromCookies } from "@/lib/supabase/user-rest";
import { revalidatePath } from "next/cache";

export type OtpActionResult = { ok: true; preview?: string } | { ok: false; error: string };

const PENDING_PURPOSE = "verify_mobile_ok";

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

async function ownProfile(db: { from: (table: string) => any }, meId: string, profileId: string | null) {
  if (!profileId) return null;
  const { data: profile } = await db
    .from("profiles")
    .select("id, created_by")
    .eq("id", profileId)
    .eq("created_by", meId)
    .maybeSingle();
  return profile;
}

export async function checkMobileAvailable(mobileRaw: string, profileId?: string | null): Promise<OtpActionResult> {
  const auth = await memberDb();
  if ("error" in auth) return { ok: false, error: String(auth.error ?? "Sign in again.") };
  const mobile = toArattaiMobile(mobileRaw);
  if (!mobile) return { ok: false, error: "Enter a 10-digit Indian mobile." };
  const holder = await findProfileUsingMobile(auth.db, mobileRaw, profileId);
  if (holder) return { ok: false, error: MOBILE_IN_USE };
  return { ok: true };
}

export async function sendMobileOtp(profileId: string | null | undefined, mobileRaw: string): Promise<OtpActionResult> {
  const auth = await memberDb();
  if ("error" in auth) return { ok: false, error: String(auth.error ?? "Sign in again.") };
  const { db, me } = auth;
  const id = String(profileId ?? "").trim();
  const profile = await ownProfile(db, me.id, id || null);
  if (id && !profile) return { ok: false, error: "This profile could not be found." };
  const mobile = toArattaiMobile(mobileRaw);
  if (!mobile) return { ok: false, error: "Enter a 10-digit Indian mobile." };

  const holder = await findProfileUsingMobile(db, mobileRaw, profile?.id ?? null);
  if (holder) return { ok: false, error: MOBILE_IN_USE };

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
    profile_id: profile?.id ?? null,
    mobile,
    code_hash: hashOtp(mobile, code),
    purpose: "verify_mobile",
    expires_at: new Date(Date.now() + OTP_TTL_MS).toISOString(),
  });
  if (insertError) return { ok: false, error: "Ask house to run SQL 053, then try again." };

  if (!notifyConfigured()) {
    if (process.env.NODE_ENV === "production") return { ok: false, error: channelOperatorHint() };
    return { ok: true, preview: code };
  }

  const sent = await sendChannelOtp(mobile, code);
  if (!sent.ok) {
    let wipe = db.from("whatsapp_otps").delete().eq("user_id", me.id).eq("mobile", mobile).eq("purpose", "verify_mobile");
    if (profile?.id) wipe = wipe.eq("profile_id", profile.id);
    await wipe;
    return { ok: false, error: sent.error ?? channelOperatorHint() };
  }
  return { ok: true };
}

export async function verifyMobileOtp(
  profileId: string | null | undefined,
  mobileRaw: string,
  codeRaw: string,
): Promise<OtpActionResult> {
  const auth = await memberDb();
  if ("error" in auth) return { ok: false, error: String(auth.error ?? "Sign in again.") };
  const { db, me } = auth;
  const id = String(profileId ?? "").trim();
  const profile = await ownProfile(db, me.id, id || null);
  if (id && !profile) return { ok: false, error: "This profile could not be found." };
  const mobile = toArattaiMobile(mobileRaw);
  const code = digitsCode(codeRaw);
  if (!mobile || code.length !== 6) return { ok: false, error: "Enter the 6-digit WhatsApp code." };

  const holder = await findProfileUsingMobile(db, mobileRaw, profile?.id ?? null);
  if (holder) return { ok: false, error: MOBILE_IN_USE };

  let lookup = db
    .from("whatsapp_otps")
    .select("id, code_hash, expires_at, mobile")
    .eq("user_id", me.id)
    .eq("mobile", mobile)
    .eq("purpose", "verify_mobile")
    .order("created_at", { ascending: false })
    .limit(1);
  if (profile?.id) lookup = lookup.eq("profile_id", profile.id);
  const { data: row } = await lookup.maybeSingle();
  if (!row || otpExpired(row.expires_at) || !otpMatches(mobile, code, row.code_hash)) {
    return { ok: false, error: "That code is wrong or has expired." };
  }

  if (!profile) {
    await db.from("whatsapp_otps").update({ purpose: PENDING_PURPOSE }).eq("id", row.id);
    return { ok: true };
  }

  const display = mobile.startsWith("91") && mobile.length === 12 ? mobile.slice(2) : mobile;
  const payload: Record<string, unknown> = {
    subject_mobile: display,
    phone_otp_verified_at: new Date().toISOString(),
    trust_tier: "mobile_confirmed",
  };
  let { error } = await db.from("profiles").update(payload).eq("id", profile.id).eq("created_by", me.id);
  if (error && missingPayloadColumn(error, payload)) {
    delete payload.trust_tier;
    const retry = await db.from("profiles").update(payload).eq("id", profile.id).eq("created_by", me.id);
    error = retry.error;
  }
  if (error) {
    if (isUniqueViolation(error)) {
      const again = await findProfileUsingMobile(db, display, profile.id);
      if (!again) {
        await db
          .from("profiles")
          .update({ phone_otp_verified_at: new Date().toISOString() })
          .eq("id", profile.id)
          .eq("created_by", me.id);
      } else {
        return { ok: false, error: MOBILE_IN_USE };
      }
    } else {
      return { ok: false, error: "Could not save the confirmed mobile." };
    }
  }

  await db.from("whatsapp_otps").delete().eq("user_id", me.id).eq("purpose", "verify_mobile");
  revalidatePath(`/app/profiles/${profile.id}`);
  revalidatePath("/app/settings");
  return { ok: true };
}

export async function consumePendingMobileVerification(
  db: { from: (table: string) => any },
  userId: string,
  mobileRaw: string,
): Promise<boolean> {
  const mobile = toArattaiMobile(mobileRaw);
  if (!mobile) return false;
  const { data: row } = await db
    .from("whatsapp_otps")
    .select("id")
    .eq("user_id", userId)
    .eq("mobile", mobile)
    .eq("purpose", PENDING_PURPOSE)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!row?.id) return false;
  await db.from("whatsapp_otps").delete().eq("id", row.id);
  return true;
}
