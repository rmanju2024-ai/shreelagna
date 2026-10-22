import { toWhatsAppNumber } from "@/lib/notify/phone";

export type ArattaiResult = { ok: boolean; error?: string; token?: string };

export type ArattaiMessageInput = {
  to: string;
  templateId: string;
  bodyParams?: string[];
  otp?: string;
  authentication?: boolean;
};

const DEFAULT_ACCOUNTS = "https://accounts.arattai.in";
const DEFAULT_API = "https://business.arattai.in/api/v1";
const DEFAULT_SCOPE = "ArattaiBusiness.messages.CREATE,ArattaiBusiness.authentications.CREATE";

let cachedToken: { value: string; expiresAt: number } | null = null;

export function arattaiOperatorHint(): string {
  return "Arattai Business is not configured. Set ARATTAI_CLIENT_ID, ARATTAI_CLIENT_SECRET, ARATTAI_COMPANY_ID, ARATTAI_BUSINESS_NUMBER_ID, and the OTP/alert template IDs. WhatsApp is not used.";
}

export function arattaiConfigured(): boolean {
  return Boolean(
    process.env.ARATTAI_CLIENT_ID?.trim() &&
      process.env.ARATTAI_CLIENT_SECRET?.trim() &&
      process.env.ARATTAI_COMPANY_ID?.trim() &&
      process.env.ARATTAI_BUSINESS_NUMBER_ID?.trim(),
  );
}

export function arattaiOtpTemplateId(): string {
  return process.env.ARATTAI_OTP_TEMPLATE_ID?.trim() || "";
}

export function arattaiAlertTemplateId(): string {
  return process.env.ARATTAI_ALERT_TEMPLATE_ID?.trim() || "";
}

export function arattaiAccountsUrl(): string {
  return process.env.ARATTAI_ACCOUNTS_URL?.trim() || DEFAULT_ACCOUNTS;
}

export function arattaiApiBase(): string {
  return (process.env.ARATTAI_API_BASE?.trim() || DEFAULT_API).replace(/\/$/, "");
}

export function toArattaiMobile(value: string | null | undefined): string | null {
  return toWhatsAppNumber(value);
}

export function buildArattaiAuthBody(): URLSearchParams {
  const params = new URLSearchParams();
  const refresh = process.env.ARATTAI_REFRESH_TOKEN?.trim();
  params.set("client_id", process.env.ARATTAI_CLIENT_ID?.trim() || "");
  params.set("client_secret", process.env.ARATTAI_CLIENT_SECRET?.trim() || "");
  if (refresh) {
    params.set("grant_type", "refresh_token");
    params.set("refresh_token", refresh);
  } else {
    params.set("grant_type", "client_credentials");
    params.set("scope", process.env.ARATTAI_OAUTH_SCOPE?.trim() || DEFAULT_SCOPE);
  }
  return params;
}

export function buildArattaiTemplatePayload(input: ArattaiMessageInput): Record<string, unknown> {
  const components: Record<string, unknown>[] = [];
  if (input.bodyParams?.length) {
    components.push({
      type: "body",
      parameters: input.bodyParams.map((text) => ({ type: "text", text: String(text).slice(0, 1024) || "-" })),
    });
  }
  if (input.otp) {
    components.push({
      type: "button",
      sub_type: "url",
      index: "0",
      parameters: [{ type: "text", text: input.otp }],
    });
  }
  return {
    company_id: process.env.ARATTAI_COMPANY_ID?.trim(),
    business_number_id: process.env.ARATTAI_BUSINESS_NUMBER_ID?.trim(),
    to: input.to,
    type: input.authentication ? "authentication" : "template",
    template: {
      id: input.templateId,
      language: process.env.ARATTAI_TEMPLATE_LANGUAGE?.trim() || "en",
      ...(components.length ? { components } : {}),
    },
  };
}

function authHeader(token: string): string {
  const scheme = process.env.ARATTAI_AUTH_SCHEME?.trim() || "Zoho-oauthtoken";
  return `${scheme} ${token}`;
}

async function accessToken(): Promise<ArattaiResult> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 30_000) {
    return { ok: true, token: cachedToken.value };
  }
  const url = `${arattaiAccountsUrl()}/oauth/v2/token`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: buildArattaiAuthBody().toString(),
    });
    const body = (await res.json().catch(() => null)) as {
      access_token?: string;
      expires_in?: number;
      error?: string;
      error_description?: string;
    } | null;
    const token = body?.access_token?.trim();
    if (!res.ok || !token) {
      return {
        ok: false,
        error: body?.error_description || body?.error || `Arattai OAuth ${res.status}`,
      };
    }
    const ttl = Number(body?.expires_in) > 0 ? Number(body?.expires_in) * 1000 : 50 * 60 * 1000;
    cachedToken = { value: token, expiresAt: Date.now() + ttl };
    return { ok: true, token };
  } catch {
    return { ok: false, error: "Arattai accounts could not be reached." };
  }
}

async function postBusiness(path: string, payload: Record<string, unknown>): Promise<ArattaiResult> {
  if (!arattaiConfigured()) return { ok: false, error: arattaiOperatorHint() };
  const token = await accessToken();
  const access = token.token;
  if (!token.ok || !access) return { ok: false, error: token.error ?? arattaiOperatorHint() };
  try {
    const res = await fetch(`${arattaiApiBase()}${path}`, {
      method: "POST",
      headers: {
        Authorization: authHeader(access),
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
      /* keep status */
    }
    return { ok: false, error: message };
  } catch {
    return { ok: false, error: "Arattai Business could not be reached." };
  }
}

export async function sendArattaiOtp(to: string, code: string): Promise<ArattaiResult> {
  const templateId = arattaiOtpTemplateId();
  if (!templateId) return { ok: false, error: "ARATTAI_OTP_TEMPLATE_ID is missing. Approve an OTP template in Arattai Business, then paste its id." };
  const payload = buildArattaiTemplatePayload({
    to,
    templateId,
    bodyParams: [code],
    otp: code,
    authentication: true,
  });
  const auth = await postBusiness("/authentications", payload);
  if (auth.ok || !(auth.error ?? "").includes("404")) return auth;
  return postBusiness("/messages", payload);
}

export async function sendArattaiAlert(to: string, bodyParams: string[]): Promise<ArattaiResult> {
  const templateId = arattaiAlertTemplateId();
  if (!templateId) return { ok: false, error: "ARATTAI_ALERT_TEMPLATE_ID is missing. Approve a transactional template in Arattai Business, then paste its id." };
  return postBusiness(
    "/messages",
    buildArattaiTemplatePayload({
      to,
      templateId,
      bodyParams,
    }),
  );
}
