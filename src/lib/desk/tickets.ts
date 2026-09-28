export const TICKET_STATUSES = ["new", "in_progress", "on_hold", "done"] as const;

export type TicketStatus = (typeof TICKET_STATUSES)[number];

export const TICKET_RESOLUTION_MAX = 2000;

export function parseTicketStatus(raw: unknown): TicketStatus | null {
  const value = String(raw ?? "").trim();
  return TICKET_STATUSES.includes(value as TicketStatus) ? (value as TicketStatus) : null;
}

export function ticketStatusLabel(status: string | null | undefined): string {
  if (status === "in_progress") return "In progress";
  if (status === "on_hold") return "On hold";
  if (status === "done") return "Done";
  if (status === "new") return "New";
  return "New";
}

export function ticketStatusClass(status: string | null | undefined): string {
  if (status === "in_progress") return "is-busy";
  if (status === "on_hold") return "is-hold";
  if (status === "done") return "is-done";
  return "is-new";
}

export function trimTicketResolution(value: unknown): string | null {
  const text = String(value ?? "").replace(/\s+/g, " ").trim();
  if (!text) return null;
  return text.slice(0, TICKET_RESOLUTION_MAX);
}

const NOTE_STATUS_MARK = /^\[\[status:([a-z_]+)\]\]\s*/i;

export function stampNoteBody(body: string, status: string | null | undefined) {
  const clean = body.replace(NOTE_STATUS_MARK, "").trim();
  const code = parseTicketStatus(status);
  if (!code) return clean.slice(0, TICKET_RESOLUTION_MAX);
  return `[[status:${code}]] ${clean}`.slice(0, TICKET_RESOLUTION_MAX);
}

export function readNoteBody(body: string | null | undefined) {
  return String(body ?? "").replace(NOTE_STATUS_MARK, "").trim();
}

export function readNoteStatus(row: { body?: string | null; ticket_status?: string | null }) {
  return parseTicketStatus(row.ticket_status) ?? parseTicketStatus(String(row.body ?? "").match(NOTE_STATUS_MARK)?.[1]);
}

export type TicketNote = {
  id: string;
  ticket_id: string;
  body: string;
  created_at: string;
  created_by?: string | null;
  actor_name?: string | null;
  actor_role?: string | null;
  ticket_status?: string | null;
};

export function notesByTicket(rows: TicketNote[]): Map<string, TicketNote[]> {
  const map = new Map<string, TicketNote[]>();
  for (const row of rows) {
    const list = map.get(row.ticket_id) ?? [];
    list.push(row);
    map.set(row.ticket_id, list);
  }
  return map;
}

export function isOpenTicket(status: string | null | undefined): boolean {
  return status !== "done";
}

export function ticketEnquiryLabel(type: string | null | undefined): string {
  if (type === "vadhu") return "Bride profile";
  if (type === "vara") return "Groom profile";
  return "General help";
}
