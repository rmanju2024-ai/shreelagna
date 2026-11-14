import type { MemberSupportRequest } from "@/lib/desk/tickets";

type TicketClient = { from: (table: string) => any };

const COLS = "id, created_at, enquiry_type, message, status, resolution";
const COLS_MIN = "id, created_at, enquiry_type, message, status";

function unique(rows: MemberSupportRequest[]) {
  const seen = new Set<string>();
  return rows.filter((row) => {
    if (!row?.id || seen.has(row.id)) return false;
    seen.add(row.id);
    return true;
  });
}

async function queryTickets(
  db: TicketClient,
  cols: string,
  apply: (query: any) => any,
): Promise<{ data: MemberSupportRequest[]; error: { message?: string } | null }> {
  const result = await apply(db.from("tickets").select(cols)).order("created_at", { ascending: false });
  return { data: result.error ? [] : result.data ?? [], error: result.error ?? null };
}

export async function loadMemberSupportRequests(
  db: TicketClient | null | undefined,
  user: { id: string; email?: string | null },
): Promise<MemberSupportRequest[]> {
  if (!db || !user.id) return [];
  const email = typeof user.email === "string" ? user.email.trim() : "";
  const rows: MemberSupportRequest[] = [];

  for (const cols of [COLS, COLS_MIN]) {
    const owned = await queryTickets(db, cols, (q) => q.eq("created_by", user.id));
    if (!owned.error) rows.push(...owned.data);
    else if (!/created_by|column|schema/i.test(String(owned.error.message ?? ""))) {
      continue;
    }
    if (email) {
      const byMail = await queryTickets(db, cols, (q) => q.ilike("email", email));
      if (!byMail.error) {
        rows.push(...byMail.data);
        break;
      }
      continue;
    }
    if (rows.length || !owned.error) break;
  }

  return unique(rows);
}
