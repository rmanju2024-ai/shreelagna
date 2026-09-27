import { createServiceClient } from "@/lib/supabase/server";
import { formatIstDate } from "@/lib/time/ist";
import { toWhatsAppNumber } from "@/lib/notify/phone";
import {
  acceptedTemplateName,
  interestTemplateName,
  isHelloWorldTemplate,
  planTemplateName,
  resolveAlertTemplate,
  sendWhatsAppTemplate,
  whatsappConfigured,
} from "@/lib/notify/whatsapp";

export type NotifyResult = { ok: true } | { ok: false; error: string };

async function loadNotifyTarget(userId: string, templateName: string, mobileHint?: string | null) {
  const db = createServiceClient();
  if (!db) return { error: "Database is not ready for WhatsApp." };
  if (!whatsappConfigured()) return { error: "WhatsApp is not configured yet." };
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
    toWhatsAppNumber(mobileHint) ||
    toWhatsAppNumber(typeof profile.data?.subject_mobile === "string" ? profile.data.subject_mobile : null);
  if (!mobile) return { error: "That profile has no WhatsApp mobile yet." };
  if (!isHelloWorldTemplate(templateName) && !profile.data?.phone_otp_verified_at) {
    return { error: "That mobile is not WhatsApp-verified yet." };
  }
  return { mobile, templateName };
}

function sendAlert(target: { mobile: string; templateName: string }, bodyParams: string[]) {
  return sendWhatsAppTemplate({
    to: target.mobile,
    name: target.templateName,
    ...(isHelloWorldTemplate(target.templateName) ? {} : { bodyParams }),
  });
}

async function notifyWith(
  userId: string,
  specific: string,
  bodyParams: string[],
  mobileHint?: string | null,
): Promise<NotifyResult> {
  const name = resolveAlertTemplate(specific);
  const target = await loadNotifyTarget(userId, name, mobileHint);
  if ("error" in target) return { ok: false, error: target.error };
  return sendAlert(target, bodyParams);
}

export async function notifyInterestReceived(userId: string, senderFirst: string, mobileHint?: string | null) {
  return notifyWith(userId, interestTemplateName(), [senderFirst.slice(0, 60) || "A member"], mobileHint);
}

export async function notifyInterestAccepted(userId: string, otherFirst: string) {
  return notifyWith(userId, acceptedTemplateName(), [otherFirst.slice(0, 60) || "A member"]);
}

export async function notifyPlanActivated(userId: string, planName: string, endsAt: Date) {
  return notifyWith(userId, planTemplateName(), [planName.slice(0, 60) || "Plan", formatIstDate(endsAt)]);
}
