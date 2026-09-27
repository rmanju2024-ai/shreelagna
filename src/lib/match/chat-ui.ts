import { formatIstChatStamp } from "@/lib/time/ist";

export function chatStamp(iso: string | Date, now = Date.now()): string {
  return formatIstChatStamp(iso, now);
}

export function latestByThread<T extends { thread_id: string; created_at: string }>(rows: T[]): Map<string, T> {
  const map = new Map<string, T>();
  for (const row of rows) {
    const prev = map.get(row.thread_id);
    if (!prev || prev.created_at < row.created_at) map.set(row.thread_id, row);
  }
  return map;
}

export function previewText(body: string | null | undefined, max = 42): string {
  const text = (body ?? "").replace(/\s+/g, " ").trim();
  if (!text) return "Tap to chat";
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

export function countByKey(items: Array<string | null | undefined>): Map<string, number> {
  const map = new Map<string, number>();
  for (const key of items) {
    if (!key) continue;
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return map;
}

export function unreadLabel(count: number): string {
  if (count <= 0) return "";
  return count > 99 ? "99+" : String(count);
}
