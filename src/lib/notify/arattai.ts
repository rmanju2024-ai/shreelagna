export type ArattaiResult = { ok: boolean; error?: string; token?: string };

export type ArattaiTextInput = { to: string; text: string };

export type ArattaiTemplateInput = {
  to: string;
  name: string;
  language?: string;
  bodyParams?: string[];
};

type TokenCache = { access: string; until: number };

declare global {
  var __slArattaiToken: TokenCache | undefined;
}

export function arattaiConfigured(): boolean {
  return Boolean(
    process.env.ARATTAI_ACCESS_TOKEN?.trim() ||
      (process.env.ARATTAI_REFRESH_TOKEN?.trim() &&
        process.env.ARATTAI_CLIENT_ID?.trim() &&
        process.env.ARATTAI_CLIENT_SECRET?.trim()),
  );
}

export function arattaiApiBase(): string {
  return (process.env.ARATTAI_API_BASE?.trim() || "https://arattai.zoho.in/arattai/v1").replace(/\/$/, "");
}

export function arattaiAccountsBase(): string {
  return (process.env.ARATTAI_ACCOUNTS_BASE?.trim() || "https://accounts.zoho.in").replace(/\/$/, "");
}

export function buildArattaiTextPayload(input: ArattaiTextInput): Record<string, unknown> {
  return {
    messaging_product: "arattai",
    recipient_type: "individual",
    to: input.to,
    type: "text",
    text: { body: input.text.slice(0, 4096) || "-" },
  };
}

export function buildArattaiTemplatePayload(input: ArattaiTemplateInput): Record<string, unknown> {
  const components: Record<string, unknown>[] = [];
  if (input.bodyParams?.length) {
    components.push({
      type: "body",
      parameters: input.bodyParams.map((text) => ({ type: "text", text: String(text).slice(0, 1024) || "-" })),
    });
  }
  return {
    messaging_product: "arattai",
    recipient_type: "individual",
    to: input.to,
    type: "template",
    template: {
      name: input.name,
      language: { code: input.language || process.env.ARATTAI_LANGUAGE?.trim() || "en" },
      ...(components.length ? { components } : {}),
    },
  };
}

export function otpMessage(code: string): string {
  return `Shree Lagna verification code: ${code}. Valid for 10 minutes. Do not share this code.`;
}

export function interestMessage(senderFirst: string): string {
  return `Shree Lagna: ${senderFirst.slice(0, 60) || "A member"} sent you an interest. Open Shree Lagna to respond.`;
}

export function acceptedMessage(otherFirst: string): string {
  return `Shree Lagna: ${otherFirst.slice(0, 60) || "A member"} accepted your interest. You can now chat.`;
}

export function planMessage(planName: string, endsLabel: string): string {
  return `Shree Lagna: ${planName.slice(0, 60) || "Your plan"} is active until ${endsLabel}.`;
}

function sendUrl(): string | null {
  const custom = process.env.ARATTAI_SEND_URL?.trim();
  if (custom) return custom;
  const phoneId = process.env.ARATTAI_PHONE_NUMBER_ID?.trim();
  const base = arattaiApiBase();
  if (phoneId) return `${base}/${phoneId}/messages`;
  return `${base}/messages`;
}

function authHeader(token: string): string {
  const scheme = process.env.ARATTAI_AUTH_SCHEME?.trim() || "Zoho-oauthtoken";
  return scheme.toLowerCase() === "bearer" ? `Bearer ${token}` : `Zoho-oauthtoken ${token}`;
}

async function accessToken(): Promise<string | null> {
  const direct = process.env.ARATTAI_ACCESS_TOKEN?.trim();
  if (direct) return direct;
  const cached = globalThis.__slArattaiToken;
  if (cached && cached.until > Date.now() + 30_000) return cached.access;

  const refresh = process.env.ARATTAI_REFRESH_TOKEN?.trim();
  const clientId = process.env.ARATTAI_CLIENT_ID?.trim();
  const clientSecret = process.env.ARATTAI_CLIENT_SECRET?.trim();
  if (!refresh || !clientId || !clientSecret) return null;

  const body = new URLSearchParams({
    refresh_token: refresh,
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: "refresh_token",
  });
  const res = await fetch(`${arattaiAccountsBase()}/oauth/v2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const json = (await res.json().catch(() => null)) as { access_token?: string; expires_in?: number } | null;
  if (!res.ok || !json?.access_token) return null;
  const ttlMs = Math.max(60, Number(json.expires_in) || 3600) * 1000;
  globalThis.__slArattaiToken = { access: json.access_token, until: Date.now() + ttlMs };
  return json.access_token;
}

async function postArattai(payload: Record<string, unknown>): Promise<ArattaiResult> {
  const url = sendUrl();
  const token = await accessToken();
  if (!url || !token) return { ok: false, error: "Arattai is not configured yet." };
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: authHeader(token),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    if (res.ok) return { ok: true };
    let message = `Arattai ${res.status}`;
    try {
      const raw: unknown = await res.json();
      if (raw && typeof raw === "object") {
        const rec = raw as Record<string, unknown>;
        if (typeof rec.message === "string" && rec.message.trim()) message = rec.message;
        else if (typeof rec.error === "string" && rec.error.trim()) message = rec.error;
        else if (rec.error && typeof rec.error === "object") {
          const nested = rec.error as Record<string, unknown>;
          if (typeof nested.message === "string" && nested.message.trim()) message = nested.message;
        }
      }
    } catch {
      /* keep status message */
    }
    return { ok: false, error: message };
  } catch {
    return { ok: false, error: "Arattai could not be reached." };
  }
}

export async function sendArattaiText(input: ArattaiTextInput): Promise<ArattaiResult> {
  return postArattai(buildArattaiTextPayload(input));
}

export async function sendArattaiTemplate(input: ArattaiTemplateInput): Promise<ArattaiResult> {
  return postArattai(buildArattaiTemplatePayload(input));
}

export async function sendArattaiOtp(to: string, code: string): Promise<ArattaiResult> {
  const template = process.env.ARATTAI_OTP_TEMPLATE?.trim();
  if (template) {
    return sendArattaiTemplate({ to, name: template, bodyParams: [code] });
  }
  return sendArattaiText({ to, text: otpMessage(code) });
}

export async function sendArattaiAlert(to: string, kind: "interest" | "accepted" | "plan", params: string[]): Promise<ArattaiResult> {
  const names = {
    interest: process.env.ARATTAI_INTEREST_TEMPLATE?.trim(),
    accepted: process.env.ARATTAI_ACCEPTED_TEMPLATE?.trim(),
    plan: process.env.ARATTAI_PLAN_TEMPLATE?.trim(),
  };
  const template = names[kind];
  if (template) return sendArattaiTemplate({ to, name: template, bodyParams: params });
  const text =
    kind === "interest"
      ? interestMessage(params[0] ?? "")
      : kind === "accepted"
        ? acceptedMessage(params[0] ?? "")
        : planMessage(params[0] ?? "", params[1] ?? "");
  return sendArattaiText({ to, text });
}
