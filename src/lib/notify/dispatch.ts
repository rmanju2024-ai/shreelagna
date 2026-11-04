import { createServiceClient } from "@/lib/supabase/server";
import { formatIstDate } from "@/lib/time/ist";
import { toArattaiMobile } from "@/lib/notify/arattai";
import { channelOperatorHint, notifyConfigured, sendChannelAlert, type AlertKind } from "@/lib/notify/channel";

export type NotifyResult = { ok: true } | { ok: false; error: string };

async function loadNotifyTarget(userId: string, mobileHint?: string | null) {
  const db = createServiceClient();
  if (!db) return { error: "Database is not ready for WhatsApp alerts." };
  if (!notifyConfigured()) return { error: channelOperatorHint() };
  const account = await db.from("app_users").select("id, notify_whatsapp").eq("id", userId).maybeSingle();
  if (account.error && !String(account.error.message ?? "").includes("notify_whatsapp")) {
    return { error: "Could not load WhatsApp alert settings." };
  }
  if (account.data && account.data.notify_whatsapp === false) {
    return { error: "WhatsApp alerts are turned off for that member." };
  }
  const profile = await db
    .from("profiles")
    .select("subject_mobile, phone_otp_verified_at")
    .eq("created_by", userId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const mobile =
    toArattaiMobile(mobileHint) ||
    toArattaiMobile(typeof profile.data?.subject_mobile === "string" ? profile.data.subject_mobile : null);
  if (!mobile) return { error: "That profile has no confirmed mobile yet." };
  if (!profile.data?.phone_otp_verified_at && !toArattaiMobile(mobileHint)) {
    return { error: "Confirm that mobile on WhatsApp first." };
  }
  return { mobile };
}

async function notifyWith(
  userId: string,
  kind: AlertKind,
  bodyParams: string[],
  mobileHint?: string | null,
): Promise<NotifyResult> {
  const target = await loadNotifyTarget(userId, mobileHint);
  if ("error" in target) return { ok: false, error: String(target.error ?? channelOperatorHint()) };
  const sent = await sendChannelAlert(kind, target.mobile, bodyParams);
  return sent.ok ? { ok: true } : { ok: false, error: sent.error ?? channelOperatorHint() };
}

export async function notifyInterestReceived(userId: string, senderFirst: string, mobileHint?: string | null) {
  return notifyWith(
    userId,
    "interest",
    ["Interest", `${senderFirst.slice(0, 60) || "A member"} sent an interest.`],
    mobileHint,
  );
}

export async function notifyInterestAccepted(userId: string, otherFirst: string) {
  return notifyWith(userId, "accepted", [
    "Accepted",
    `${otherFirst.slice(0, 60) || "A member"} accepted your interest.`,
  ]);
}

export async function notifyPlanActivated(userId: string, planName: string, endsAt: Date) {
  return notifyWith(userId, "plan", [planName.slice(0, 60) || "Plan", `Active until ${formatIstDate(endsAt)}.`]);
}
