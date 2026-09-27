import { formatIstRelative, parseInstant } from "@/lib/time/ist";

const ONLINE_WITHIN_MS = 5 * 60 * 1000;
const TOUCH_EVERY_MS = 2 * 60 * 1000;

export function isOnlineNow(iso: string | null | undefined, now = Date.now()): boolean {
  const at = parseSeen(iso);
  return at !== null && now - at.getTime() < ONLINE_WITHIN_MS;
}

export function shouldTouchLastSeen(iso: string | null | undefined, now = Date.now()): boolean {
  const at = parseSeen(iso);
  return at === null || now - at.getTime() >= TOUCH_EVERY_MS;
}

export function lastOnlineLine(
  iso: string | null | undefined,
  _profileType?: string | null,
  now = Date.now(),
): string | null {
  const at = parseSeen(iso);
  if (!at) return null;
  if (now - at.getTime() < ONLINE_WITHIN_MS) return "Online now";
  return `Last seen ${formatIstRelative(at, now)}`;
}

export function parseSeen(iso: string | Date | null | undefined): Date | null {
  return parseInstant(iso);
}
