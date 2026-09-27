/** India Standard Time — wall clock is always UTC+05:30, never the server zone. */
export const IST_OFFSET_MS = (5 * 60 + 30) * 60 * 1000;

export function parseInstant(value: string | Date | null | undefined): Date | null {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value !== "string") return null;
  const raw = value.trim();
  if (!raw) return null;
  const at = new Date(normalizeTimestamp(raw));
  return Number.isNaN(at.getTime()) ? null : at;
}

function normalizeTimestamp(raw: string): string {
  let value = raw.includes("T") ? raw : raw.replace(" ", "T");
  value = value.replace(/\.(\d{3})\d+/, ".$1");
  if (!/[zZ]|[+-]\d{2}(?::?\d{2})?$/.test(value)) value += "Z";
  return value;
}

function istClock(at: Date): Date {
  return new Date(at.getTime() + IST_OFFSET_MS);
}

export function istDayKey(at: Date): string {
  const d = istClock(at);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Monday of the IST week as YYYY-MM-DD. */
export function istWeekStartKey(at: Date = new Date()): string {
  const d = istClock(at);
  const back = d.getUTCDay() === 0 ? 6 : d.getUTCDay() - 1;
  const start = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - back));
  const y = start.getUTCFullYear();
  const m = String(start.getUTCMonth() + 1).padStart(2, "0");
  const day = String(start.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function formatIstTime(at: Date): string {
  const d = istClock(at);
  let hour = d.getUTCHours();
  const minute = String(d.getUTCMinutes()).padStart(2, "0");
  const suffix = hour >= 12 ? "pm" : "am";
  hour = hour % 12 || 12;
  return `${hour}:${minute} ${suffix}`;
}

export function formatIstDate(at: Date, withYear = true): string {
  const d = istClock(at);
  const line = `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`;
  return withYear ? `${line} ${d.getUTCFullYear()}` : line;
}

export function istMonthKey(at: Date): string {
  const d = istClock(at);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function formatIstMonth(at: Date): string {
  const d = istClock(at);
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

export function formatIstDateTime(value: string | Date): string {
  const at = parseInstant(value);
  if (!at) return "";
  return `${formatIstDate(at)} · ${formatIstTime(at)} IST`;
}

export function formatIstRelative(value: string | Date, now = Date.now()): string {
  const at = parseInstant(value);
  if (!at) return "";
  const time = formatIstTime(at);
  const seen = istDayKey(at);
  if (seen === istDayKey(new Date(now))) return `today at ${time} IST`;
  if (seen === istDayKey(new Date(now - 24 * 60 * 60 * 1000))) return `yesterday at ${time} IST`;
  return `${formatIstDate(at, false)} at ${time} IST`;
}

export function formatIstChatStamp(value: string | Date, now = Date.now()): string {
  const at = parseInstant(value);
  if (!at) return "";
  const seen = istDayKey(at);
  if (seen === istDayKey(new Date(now))) return formatIstTime(at);
  if (seen === istDayKey(new Date(now - 24 * 60 * 60 * 1000))) return "Yesterday";
  return formatIstDate(at, false);
}
