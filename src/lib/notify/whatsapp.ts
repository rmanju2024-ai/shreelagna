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
  if (e.includes("could not be reached")) return "net";
  if (e.includes("not configured")) return "config";
  if (e.includes("no whatsapp mobile")) return "mobile";
  return "0";
}

export function whatsappConfigured(): boolean {
  return Boolean(process.env.WHATSAPP_TOKEN?.trim() && process.env.WHATSAPP_PHONE_NUMBER_ID?.trim());
}

export function otpTemplateName(): string {
  return process.env.WHATSAPP_OTP_TEMPLATE?.trim() || "shreelagna_otp";
}

export function interestTemplateName(): string {
  return process.env.WHATSAPP_INTEREST_TEMPLATE?.trim() || "shreelagna_interest";
}

export function acceptedTemplateName(): string {
  return process.env.WHATSAPP_ACCEPTED_TEMPLATE?.trim() || "shreelagna_interest_accepted";
}

export function planTemplateName(): string {
  return process.env.WHATSAPP_PLAN_TEMPLATE?.trim() || "shreelagna_plan";
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

export async function sendWhatsAppTemplate(input: WhatsAppTemplateInput): Promise<WhatsAppResult> {
  const token = process.env.WHATSAPP_TOKEN?.trim();
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID?.trim();
  if (!token || !phoneId) {
    return { ok: false, error: "WhatsApp is not configured yet." };
  }
  const version = process.env.WHATSAPP_API_VERSION?.trim() || "v25.0";
  const url = `https://graph.facebook.com/${version}/${phoneId}/messages`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(buildWhatsAppPayload(input)),
    });
    if (res.ok) return { ok: true };
    const body = (await res.json().catch(() => null)) as GraphMessageError | null;
    const title = body?.error?.error_user_msg || body?.error?.message || `WhatsApp ${res.status}`;
    const details = body?.error?.error_data?.details;
    const code = body?.error?.code;
    const message = [code ? `(#${code}) ${title.replace(/^\(#\d+\)\s*/, "")}` : title, details]
      .filter(Boolean)
      .join(" — ");
    return { ok: false, error: message };
  } catch {
    return { ok: false, error: "WhatsApp could not be reached." };
  }
}
