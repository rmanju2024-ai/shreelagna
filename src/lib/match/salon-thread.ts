import { formatIstTime, istDayKey, parseInstant } from "@/lib/time/ist";

export const CHAT_GROUP_MS = 5 * 60 * 1000;

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

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
      showSeen: boolean;
      label: string;
    };

export function chatDayLabel(iso: string, now = Date.now()): string {
  const at = parseInstant(iso);
  if (!at) return "";
  const ist = new Date(at.getTime() + (5 * 60 + 30) * 60 * 1000);
  const weekday = WEEKDAYS[ist.getUTCDay()];
  const day = ist.getUTCDate();
  const month = MONTHS[ist.getUTCMonth()];
  const year = ist.getUTCFullYear();
  const thisYear = new Date(now + (5 * 60 + 30) * 60 * 1000).getUTCFullYear();
  return year === thisYear ? `${weekday}, ${day} ${month}` : `${weekday}, ${day} ${month} ${year}`;
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
): SalonRow[] {
  const rows: SalonRow[] = [];
  const unreadAt = firstUnreadIndex(messages, myProfileId);
  let lastMineId: string | null = null;
  for (const msg of messages) {
    if (msg.sender_profile_id === myProfileId && !msg.pending) lastMineId = msg.id;
  }

  messages.forEach((msg, index) => {
    const prev = messages[index - 1];
    const at = parseInstant(msg.created_at)?.getTime() ?? 0;
    const prevAt = parseInstant(prev?.created_at)?.getTime() ?? 0;
    const newDay = !prev || istDayKey(new Date(at)) !== istDayKey(new Date(prevAt));
    if (newDay) {
      rows.push({ kind: "day", key: `day-${msg.id}`, label: chatDayLabel(msg.created_at) });
    }
    if (index === unreadAt && unreadAt >= 0) {
      rows.push({ kind: "unread" });
    }
    const mine = msg.sender_profile_id === myProfileId;
    const sameSender = prev && prev.sender_profile_id === msg.sender_profile_id;
    const close = sameSender && at - prevAt <= CHAT_GROUP_MS;
    rows.push({
      kind: "msg",
      msg,
      mine,
      showName: !close,
      tight: Boolean(close),
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
