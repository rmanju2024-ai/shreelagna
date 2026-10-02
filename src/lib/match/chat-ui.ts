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

/** Newest open thread whose other profile is active; null when none. */
export function pickFirstChat<T extends { id: string; profile_a: string; profile_b: string }>(
  threads: T[],
  myIds: string[],
  others: Map<string, { status?: string | null }>,
): T | null {
  for (const thread of threads) {
    const other = myIds.includes(thread.profile_a) ? thread.profile_b : thread.profile_a;
    if (others.get(other)?.status === "active") return thread;
  }
  return null;
}
