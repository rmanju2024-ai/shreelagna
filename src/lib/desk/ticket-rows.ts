import type { TicketNote } from "@/lib/desk/tickets";

const FULL =
  "id, name, city, status, created_at, message, email, mobile, enquiry_type, resolution";
const BASIC = "id, name, city, status, created_at, message, email, mobile, enquiry_type";

type Db = { from: (table: string) => any };

export type DeskTicketRow = {
  id: string;
  name: string;
  city?: string | null;
  status?: string | null;
  created_at?: string | null;
  message?: string | null;
  email?: string | null;
  mobile?: string | null;
  enquiry_type?: string | null;
  resolution?: string | null;
};

export async function fetchDeskTickets(
  supabase: Db,
  from = 0,
  to = 19,
): Promise<{ rows: DeskTicketRow[]; count: number }> {
  const listed = await supabase
    .from("tickets")
    .select(FULL, { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);
  if (listed.error) {
    const retry = await supabase
      .from("tickets")
      .select(BASIC, { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to);
    return { rows: (retry.data ?? []) as DeskTicketRow[], count: retry.count ?? 0 };
  }
  return { rows: (listed.data ?? []) as DeskTicketRow[], count: listed.count ?? 0 };
}

export async function fetchDeskTicket(supabase: Db, id: string) {
  const row = await supabase.from("tickets").select(FULL).eq("id", id).maybeSingle();
  if (row.error) {
    const retry = await supabase.from("tickets").select(BASIC).eq("id", id).maybeSingle();
    return retry.data;
  }
  return row.data;
}

export async function fetchTicketNotes(supabase: Db, ids: string[]) {
  if (!ids.length) return [] as TicketNote[];
  const { data, error } = await supabase
    .from("ticket_notes")
    .select("id, ticket_id, body, created_at")
    .in("ticket_id", ids)
    .order("created_at");
  if (error) return [];
  return data ?? [];
}

export function ticketPreview(message: unknown, max = 88): string {
  const text = String(message ?? "").replace(/\s+/g, " ").trim();
  if (!text) return "No message";
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}
