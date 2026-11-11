import { formatIstDate, formatIstTime, istDayKey, parseInstant } from "@/lib/time/ist";

export type SalonMsg = {
  id: string;
  sender_profile_id: string;
  body: string;
  created_at: string;
  read_at?: string | null;
  edited_at?: string | null;
  deleted_at?: string | null;
  pending?: boolean;
};

export type SalonRow =
  | { kind: "day"; key: string; label: string }
  | { kind: "unread" }
  | {
      kind: "msg";
      msg: SalonMsg;
      mine: boolean;
      showName: boolean;
      tight: boolean;
      showTime: boolean;
      showSeen: boolean;
      label: string;
    };

export function chatDayLabel(iso: string, now = Date.now()): string {
  const at = parseInstant(iso);
  if (!at) return "";
  const day = istDayKey(at);
  if (day === istDayKey(new Date(now))) return "Today";
  if (day === istDayKey(new Date(now - 24 * 60 * 60 * 1000))) return "Yesterday";
  return formatIstDate(at, true);
}

export function chatPresenceLine(online: boolean, lastSeen: string | null, now = Date.now()): string {
  if (online) return "Online now";
  if (!lastSeen) return "";
  const at = parseInstant(lastSeen);
  if (!at) return lastSeen.replace(/^Last seen\s+/i, "Last seen ");
  const today = istDayKey(new Date(now)) === istDayKey(at);
  const time = formatIstTime(at);
  if (today) return `Last seen today, ${time}`;
  return `Last seen ${time}`;
}

export function firstUnreadIndex(messages: SalonMsg[], myProfileId: string): number {
  return messages.findIndex((msg) => msg.sender_profile_id !== myProfileId && !msg.read_at && !msg.pending);
}

export function buildSalonRows(
  messages: SalonMsg[],
  myProfileId: string,
  peerName: string,
  now = Date.now(),
): SalonRow[] {
  const rows: SalonRow[] = [];
  const unreadAt = firstUnreadIndex(messages, myProfileId);
  let lastMineId: string | null = null;
  let lastDayKey = "";
  for (const msg of messages) {
    if (msg.sender_profile_id === myProfileId && !msg.pending) lastMineId = msg.id;
  }

  messages.forEach((msg, index) => {
    const prev = messages[index - 1];
    const at = parseInstant(msg.created_at)?.getTime() ?? 0;
    const prevAt = parseInstant(prev?.created_at)?.getTime() ?? 0;
    const day = at ? istDayKey(new Date(at)) : "";
    if (day && day !== lastDayKey) {
      rows.push({ kind: "day", key: `day-${day}`, label: chatDayLabel(msg.created_at, now) });
      lastDayKey = day;
    }
    if (index === unreadAt && unreadAt >= 0) {
      rows.push({ kind: "unread" });
    }
    const mine = msg.sender_profile_id === myProfileId;
    const sameSender = prev && prev.sender_profile_id === msg.sender_profile_id;
    const sameDay = Boolean(day && prevAt && istDayKey(new Date(prevAt)) === day);
    const close = Boolean(sameSender && sameDay);
    rows.push({
      kind: "msg",
      msg,
      mine,
      showName: !close,
      tight: close,
      showTime: true,
      showSeen: Boolean(mine && msg.id === lastMineId && msg.read_at),
      label: mine ? "You" : peerName,
    });
  });
  return rows;
}

export function messageMatchesQuery(body: string, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return body.toLowerCase().includes(q);
}
