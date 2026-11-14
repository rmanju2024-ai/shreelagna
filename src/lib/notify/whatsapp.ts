export type WhatsAppResult = { ok: true } | { ok: false; error: string };

export type WhatsAppTemplateInput = {
  to: string;
  name: string;
  language?: string;
  bodyParams?: string[];
  copyCode?: string;
};

type GraphMessageError = {
  error?: {
    message?: string;
    error_user_msg?: string;
    code?: number;
    error_data?: { details?: string };
  };
};

export function whatsappFailFlag(error: string): string {
  const e = error.toLowerCase();
  if (e.includes("allowed list") || e.includes("131030")) return "allowlist";
  if (e.includes("131005") || e.includes("access denied")) return "denied";
  if (e.includes("133010") || e.includes("account not registered")) return "mobile";
  if (e.includes("could not be reached")) return "net";
  if (e.includes("not configured")) return "config";
  if (e.includes("no whatsapp mobile")) return "mobile";
  return "0";
}

export function explainWhatsAppError(code: number | undefined, raw: string): string {
  if (code === 133010 || /account not registered/i.test(raw)) {
    return "WhatsApp Cloud (#133010): either the member mobile is not on WhatsApp, or this sender is not Cloud-registered yet. If you just added 84317, set WHATSAPP_REGISTER_PIN (the 6-digit two-step PIN) and put 84317’s API Setup Phone number ID first in WHATSAPP_PHONE_NUMBER_ID. Keep 1317222201476313 (97386) in WHATSAPP_PHONE_NUMBER_ID_FALLBACK.";
  }
  if (code === 190 || /application has been deleted|validating access token/i.test(raw)) {
    return "WhatsApp API token is invalid. Set a new WHATSAPP_TOKEN from a live Meta app.";
  }
  if (code === 131026) return "WhatsApp could not deliver to this mobile. Confirm the number is on WhatsApp.";
  if (code === 131030) return "This test number is not on the WhatsApp allow list yet.";
  return raw.replace(/^\(#\d+\)\s*/, "") || "WhatsApp could not send just now.";
}

export function whatsappPhoneNumberIds(): string[] {
  const raw = [
    process.env.WHATSAPP_PHONE_NUMBER_ID,
    process.env.WHATSAPP_PHONE_NUMBER_ID_FALLBACK,
  ]
    .filter(Boolean)
    .join(",");
  return [...new Set(raw.split(/[,\s]+/).map((id) => id.trim()).filter(Boolean))];
}

export function whatsappConfigured(): boolean {
  return Boolean(process.env.WHATSAPP_TOKEN?.trim() && whatsappPhoneNumberIds().length);
}

export function whatsappRegisterPin(): string {
  return process.env.WHATSAPP_REGISTER_PIN?.replace(/\D/g, "").slice(0, 6) ?? "";
}

export function graphMessagesUrl(phoneId: string, version?: string): string {
  const v = version || process.env.WHATSAPP_API_VERSION?.trim() || "v25.0";
  return `https://graph.facebook.com/${v}/${phoneId}/messages`;
}

export function graphRegisterUrl(phoneId: string, version?: string): string {
  const v = version || process.env.WHATSAPP_API_VERSION?.trim() || "v25.0";
  return `https://graph.facebook.com/${v}/${phoneId}/register`;
}

export function buildRegisterPayload(pin: string): Record<string, string> {
  return { messaging_product: "whatsapp", pin };
}

/** Cloud numbers stay Pending in Manager until they are registered, then a template is sent. */
export async function registerWhatsAppCloudNumber(phoneId: string): Promise<WhatsAppResult> {
  const token = process.env.WHATSAPP_TOKEN?.trim();
  const pin = whatsappRegisterPin();
  if (!token || pin.length !== 6) {
    return { ok: false, error: "Set WHATSAPP_TOKEN and a 6-digit WHATSAPP_REGISTER_PIN to register the Cloud sender." };
  }
  try {
    const res = await fetch(graphRegisterUrl(phoneId), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(buildRegisterPayload(pin)),
    });
    if (res.ok) return { ok: true };
    const body = (await res.json().catch(() => null)) as GraphMessageError | null;
    const title = body?.error?.error_user_msg || body?.error?.message || `WhatsApp ${res.status}`;
    const code = body?.error?.code;
    return { ok: false, error: explainWhatsAppError(code, title) };
  } catch {
    return { ok: false, error: "WhatsApp could not be reached." };
  }
}

/** Interest / plan WhatsApp (and channel) alerts. OTP is separate. Off unless explicitly true. */
export function whatsappSendAlerts(): boolean {
  const raw = process.env.WHATSAPP_SEND_ALERTS?.trim().toLowerCase();
  return raw === "true" || raw === "1" || raw === "yes";
}

export function otpTemplateName(): string {
  return process.env.WHATSAPP_OTP_TEMPLATE?.trim() || "marriageconnect_otp";
}

export function interestTemplateName(): string {
  return process.env.WHATSAPP_INTEREST_TEMPLATE?.trim() || "marriageconnect_interest";
}

export function acceptedTemplateName(): string {
  return process.env.WHATSAPP_ACCEPTED_TEMPLATE?.trim() || "marriageconnect_interest_accepted";
}

export function planTemplateName(): string {
  return process.env.WHATSAPP_PLAN_TEMPLATE?.trim() || "marriageconnect_plan";
}

export function isHelloWorldTemplate(name: string): boolean {
  return name.trim().toLowerCase() === "hello_world";
}

export function resolveAlertTemplate(specific: string): string {
  const override = process.env.WHATSAPP_ALERT_TEMPLATE?.trim();
  if (override) return override;
  if (process.env.NODE_ENV !== "production") return "hello_world";
  return specific;
}

export function buildWhatsAppPayload(input: WhatsAppTemplateInput): Record<string, unknown> {
  const components: Record<string, unknown>[] = [];
  if (input.bodyParams?.length) {
    components.push({
      type: "body",
      parameters: input.bodyParams.map((text) => ({ type: "text", text: String(text).slice(0, 1024) || "-" })),
    });
  }
  if (input.copyCode) {
    components.push({
      type: "button",
      sub_type: "url",
      index: "0",
      parameters: [{ type: "text", text: input.copyCode }],
    });
  }
  return {
    messaging_product: "whatsapp",
    to: input.to,
    type: "template",
    template: {
      name: input.name,
      language: { code: input.language || process.env.WHATSAPP_OTP_LANGUAGE?.trim() || "en_US" },
      ...(components.length ? { components } : {}),
    },
  };
}

export function otpLanguageCandidates(preferred?: string): string[] {
  const first = preferred?.trim() || process.env.WHATSAPP_OTP_LANGUAGE?.trim() || "en";
  return [...new Set([first, "en", "en_US"].filter(Boolean))];
}

export async function sendWhatsAppTemplate(input: WhatsAppTemplateInput): Promise<WhatsAppResult> {
  const token = process.env.WHATSAPP_TOKEN?.trim();
  const phoneIds = whatsappPhoneNumberIds();
  if (!token || !phoneIds.length) {
    return { ok: false, error: "WhatsApp is not configured yet." };
  }
  const version = process.env.WHATSAPP_API_VERSION?.trim() || "v25.0";
  const languages = otpLanguageCandidates(input.language);
  try {
    let last: WhatsAppResult = { ok: false, error: "WhatsApp could not send just now." };
    const registered = new Set<string>();
    for (const phoneId of phoneIds) {
      const url = graphMessagesUrl(phoneId, version);
      sender: for (let pass = 0; pass < 2; pass++) {
        for (const language of languages) {
          const res = await fetch(url, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(buildWhatsAppPayload({ ...input, language })),
          });
          if (res.ok) return { ok: true };
          const body = (await res.json().catch(() => null)) as GraphMessageError | null;
          const title = body?.error?.error_user_msg || body?.error?.message || `WhatsApp ${res.status}`;
          const details = body?.error?.error_data?.details;
          const code = body?.error?.code;
          const raw = [code ? `(#${code}) ${title.replace(/^\(#\d+\)\s*/, "")}` : title, details]
            .filter(Boolean)
            .join(" — ");
          last = { ok: false, error: explainWhatsAppError(code, raw) };
          const tryNextLanguage = code === 132000 || code === 132001 || /template.*language|translation/i.test(raw);
          const senderNotReady =
            code === 133010 ||
            code === 133016 ||
            /account not registered|phone number.*not registered|not registered/i.test(raw);
          if (tryNextLanguage) continue;
          if (senderNotReady && pass === 0 && !registered.has(phoneId) && whatsappRegisterPin().length === 6) {
            registered.add(phoneId);
            await registerWhatsAppCloudNumber(phoneId);
            continue sender;
          }
          if (senderNotReady) break sender;
          return last;
        }
        break;
      }
    }
    return last;
  } catch {
    return { ok: false, error: "WhatsApp could not be reached." };
  }
}
