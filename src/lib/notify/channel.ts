import { sendArattaiAlert, sendArattaiOtp, arattaiConfigured, arattaiOperatorHint } from "@/lib/notify/arattai";
import {
  acceptedTemplateName,
  interestTemplateName,
  isHelloWorldTemplate,
  otpTemplateName,
  planTemplateName,
  resolveAlertTemplate,
  sendWhatsAppTemplate,
  whatsappConfigured,
  whatsappSendAlerts,
} from "@/lib/notify/whatsapp";

export type ChannelResult = { ok: boolean; error?: string };
export type AlertKind = "interest" | "accepted" | "plan" | "notice";

/** WhatsApp Cloud API is the live path when keys exist. Arattai remains a fallback. */
export function notifyProvider(): "arattai" | "whatsapp" | "none" {
  const forced = process.env.NOTIFY_CHANNEL?.trim().toLowerCase();
  if (forced === "whatsapp" && whatsappConfigured()) return "whatsapp";
  if (forced === "arattai" && arattaiConfigured()) return "arattai";
  if (whatsappConfigured()) return "whatsapp";
  if (arattaiConfigured()) return "arattai";
  return "none";
}

export function notifyConfigured(): boolean {
  return notifyProvider() !== "none";
}

export function channelOperatorHint(): string {
  if (whatsappConfigured()) {
    return "WhatsApp could not send just now. Confirm WHATSAPP_TOKEN, WHATSAPP_PHONE_NUMBER_ID, and approved OTP/alert templates.";
  }
  if (arattaiConfigured()) return arattaiOperatorHint();
  return "Set WHATSAPP_TOKEN and WHATSAPP_PHONE_NUMBER_ID, then approve OTP and alert templates in Meta WhatsApp Cloud.";
}

async function sendWhatsAppOtp(to: string, code: string): Promise<ChannelResult> {
  return sendWhatsAppTemplate({
    to,
    name: otpTemplateName(),
    bodyParams: [code],
    copyCode: process.env.WHATSAPP_OTP_COPY_CODE === "false" ? undefined : code,
  });
}

async function sendWhatsAppAlert(kind: AlertKind, to: string, params: string[]): Promise<ChannelResult> {
  const specific =
    kind === "accepted" ? acceptedTemplateName() : kind === "plan" ? planTemplateName() : interestTemplateName();
  const name = resolveAlertTemplate(specific);
  return sendWhatsAppTemplate({
    to,
    name,
    ...(isHelloWorldTemplate(name) ? {} : { bodyParams: params }),
  });
}

export async function sendChannelOtp(to: string, code: string): Promise<ChannelResult> {
  const provider = notifyProvider();
  if (provider === "whatsapp") {
    const sent = await sendWhatsAppOtp(to, code);
    if (sent.ok || !arattaiConfigured()) return sent;
    const fallback = await sendArattaiOtp(to, code);
    return fallback.ok ? { ok: true } : sent;
  }
  if (provider === "arattai") {
    const sent = await sendArattaiOtp(to, code);
    if (sent.ok || !whatsappConfigured()) {
      return sent.ok ? { ok: true } : { ok: false, error: sent.error || "Could not send the code." };
    }
    return sendWhatsAppOtp(to, code);
  }
  return { ok: false, error: channelOperatorHint() };
}

export async function sendChannelAlert(kind: AlertKind, to: string, params: string[]): Promise<ChannelResult> {
  if (!whatsappSendAlerts()) return { ok: true };
  const provider = notifyProvider();
  if (provider === "whatsapp") {
    const sent = await sendWhatsAppAlert(kind, to, params);
    if (sent.ok || !arattaiConfigured()) return sent;
    const fallback = await sendArattaiAlert(to, params);
    return fallback.ok ? { ok: true } : sent;
  }
  if (provider === "arattai") {
    const sent = await sendArattaiAlert(to, params);
    if (sent.ok || !whatsappConfigured()) {
      return sent.ok ? { ok: true } : { ok: false, error: sent.error || "Could not send the alert." };
    }
    return sendWhatsAppAlert(kind, to, params);
  }
  return { ok: false, error: channelOperatorHint() };
}
