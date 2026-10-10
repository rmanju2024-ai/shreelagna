import { createServiceClient } from "@/lib/supabase/server";
import { formatIstDate } from "@/lib/time/ist";
import { toWhatsAppNumber } from "@/lib/notify/phone";
import { notifyConfigured, sendChannelAlert } from "@/lib/notify/channel";

export type NotifyResult = { ok: true } | { ok: false; error: string };

async function loadNotifyTarget(userId: string, mobileHint?: string | null) {
  const db = createServiceClient();
  if (!db) return { error: "Database is not ready for Arattai." };
  if (!notifyConfigured()) return { error: "Arattai is not configured yet." };
  const account = await db.from("app_users").select("id, notify_whatsapp").eq("id", userId).maybeSingle();
  if (account.error && !String(account.error.message ?? "").includes("notify_whatsapp")) {
    return { error: "Could not load alert settings." };
  }
  if (account.data && account.data.notify_whatsapp === false) {
    return { error: "Message alerts are turned off for that member." };
  }
  const profile = await db
    .from("profiles")
    .select("subject_mobile, phone_otp_verified_at")
    .eq("created_by", userId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const mobile =
    toWhatsAppNumber(mobileHint) ||
    toWhatsAppNumber(typeof profile.data?.subject_mobile === "string" ? profile.data.subject_mobile : null);
  if (!mobile) return { error: "That profile has no mobile yet." };
  if (!profile.data?.phone_otp_verified_at) {
    return { error: "That mobile is not verified yet." };
  }
  return { mobile };
}

async function notifyWith(
  userId: string,
  kind: "interest" | "accepted" | "plan",
  bodyParams: string[],
  mobileHint?: string | null,
): Promise<NotifyResult> {
  const target = await loadNotifyTarget(userId, mobileHint);
  if ("error" in target) return { ok: false, error: String(target.error ?? "Could not send Arattai.") };
  return sendChannelAlert(kind, target.mobile, bodyParams);
}

export async function notifyInterestReceived(userId: string, senderFirst: string, mobileHint?: string | null) {
  return notifyWith(userId, "interest", [senderFirst.slice(0, 60) || "A member"], mobileHint);
}

export async function notifyInterestAccepted(userId: string, otherFirst: string) {
  return notifyWith(userId, "accepted", [otherFirst.slice(0, 60) || "A member"]);
}

export async function notifyPlanActivated(userId: string, planName: string, endsAt: Date) {
  return notifyWith(userId, "plan", [planName.slice(0, 60) || "Plan", formatIstDate(endsAt)]);
}
