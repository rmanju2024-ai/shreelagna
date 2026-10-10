import { createHash, randomInt } from "node:crypto";

export const OTP_TTL_MS = 10 * 60 * 1000;
export const OTP_RESEND_MS = 60 * 1000;

export function makeOtpCode(): string {
  return String(randomInt(100000, 1000000));
}

export function otpSecret(): string {
  return process.env.ARATTAI_OTP_SECRET || process.env.WHATSAPP_OTP_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || "shreelagna-dev-otp";
}

export function hashOtp(mobile: string, code: string, secret = otpSecret()): string {
  return createHash("sha256").update(`${secret}:${mobile}:${code}`).digest("hex");
}

export function otpMatches(mobile: string, code: string, storedHash: string, secret = otpSecret()): boolean {
  const next = hashOtp(mobile, digitsCode(code), secret);
  return next.length === storedHash.length && next === storedHash;
}

export function digitsCode(code: string): string {
  return code.replace(/\D/g, "").slice(0, 6);
}

export function otpExpired(expiresAt: string | Date, now = Date.now()): boolean {
  const at = typeof expiresAt === "string" ? Date.parse(expiresAt) : expiresAt.getTime();
  return !Number.isFinite(at) || at <= now;
}
