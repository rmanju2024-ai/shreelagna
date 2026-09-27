import { aboutPlainText } from "@/lib/profile/about-html";

export type ContentFlag = "phone" | "email" | "whatsapp" | "web";

const EMAIL = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
const WEB = /https?:\/\/|www\./i;
const WHATSAPP = /\bwhats?\s*app\b|wa\.me\/|chat\.whatsapp\.com/i;
const PHONE =
  /(?:\+?91[\s-]?)?[6-9]\d{9}|(?:(?:\+|00)[1-9]\d{6,14})|\b\d{10,12}\b/;

export function contentFlags(text: string | null | undefined): ContentFlag[] {
  const raw = aboutPlainText(text ?? "");
  if (!raw.trim()) return [];
  const found: ContentFlag[] = [];
  if (PHONE.test(raw)) found.push("phone");
  if (EMAIL.test(raw)) found.push("email");
  if (WHATSAPP.test(raw)) found.push("whatsapp");
  if (WEB.test(raw) && !WHATSAPP.test(raw)) found.push("web");
  return found;
}

export function contactTextHash(text: string | null | undefined): string {
  const raw = aboutPlainText(text ?? "");
  let hash = 5381;
  for (let i = 0; i < raw.length; i += 1) hash = (Math.imul(hash, 33) ^ raw.charCodeAt(i)) >>> 0;
  return hash.toString(16);
}

export function activeContactFlags(
  text: string | null | undefined,
  clearedHash?: string | null,
): ContentFlag[] {
  const flags = contentFlags(text);
  if (!flags.length) return [];
  if (clearedHash && clearedHash === contactTextHash(text)) return [];
  return flags;
}

export function contentFlagLabel(flag: ContentFlag): string {
  if (flag === "phone") return "Mobile";
  if (flag === "email") return "Email";
  if (flag === "whatsapp") return "WhatsApp";
  return "Link";
}

export const MEMBER_CONTACT_WARNING =
  "Do not share mobile, email, or WhatsApp here. Staff will review.";
