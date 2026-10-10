import { sendArattaiAlert, sendArattaiOtp, arattaiConfigured } from "@/lib/notify/arattai";
import {
  acceptedTemplateName,
  interestTemplateName,
  isHelloWorldTemplate,
  otpTemplateName,
  planTemplateName,
  resolveAlertTemplate,
  sendWhatsAppTemplate,
  whatsappConfigured,
} from "@/lib/notify/whatsapp";

export type ChannelResult = { ok: boolean; error?: string };

/** Prefer Arattai when keys exist; WhatsApp stays as unused fallback. */
export function notifyProvider(): "arattai" | "whatsapp" | "none" {
  const forced = process.env.NOTIFY_CHANNEL?.trim().toLowerCase();
  if (forced === "whatsapp" && whatsappConfigured()) return "whatsapp";
  if (forced === "arattai" && arattaiConfigured()) return "arattai";
  if (arattaiConfigured()) return "arattai";
  if (whatsappConfigured()) return "whatsapp";
  return "none";
}

export function notifyConfigured(): boolean {
  return notifyProvider() !== "none";
}

export async function sendChannelOtp(to: string, code: string): Promise<ChannelResult> {
  const provider = notifyProvider();
  if (provider === "arattai") {
    const sent = await sendArattaiOtp(to, code);
    return sent.ok ? { ok: true } : { ok: false, error: sent.error || "Arattai could not send the code." };
  }
  if (provider === "whatsapp") {
    return sendWhatsAppTemplate({
      to,
      name: otpTemplateName(),
      bodyParams: [code],
      copyCode: process.env.WHATSAPP_OTP_COPY_CODE === "false" ? undefined : code,
    });
  }
  return { ok: false, error: "Arattai is not configured yet." };
}

export async function sendChannelAlert(
  kind: "interest" | "accepted" | "plan",
  to: string,
  params: string[],
): Promise<ChannelResult> {
  const provider = notifyProvider();
  if (provider === "arattai") {
    const sent = await sendArattaiAlert(to, kind, params);
    return sent.ok ? { ok: true } : { ok: false, error: sent.error || "Arattai could not send the alert." };
  }
  if (provider === "whatsapp") {
    const specific =
      kind === "interest" ? interestTemplateName() : kind === "accepted" ? acceptedTemplateName() : planTemplateName();
    const name = resolveAlertTemplate(specific);
    return sendWhatsAppTemplate({
      to,
      name,
      ...(isHelloWorldTemplate(name) ? {} : { bodyParams: params }),
    });
  }
  return { ok: false, error: "Arattai is not configured yet." };
}
