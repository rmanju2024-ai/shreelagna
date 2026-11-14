import type { MemberSupportRequest } from "@/lib/desk/tickets";

type TicketClient = { from: (table: string) => any };

const COLS = "id, created_at, enquiry_type, message, status, resolution";

export async function loadMemberSupportRequests(
  db: TicketClient | null | undefined,
  user: { id: string; email?: string | null },
): Promise<MemberSupportRequest[]> {
  if (!db) return [];
  const owned = await db.from("tickets").select(COLS).eq("created_by", user.id).order("created_at", {
    ascending: false,
  });
  let rows: MemberSupportRequest[] = owned.error ? [] : owned.data ?? [];
  if ((!rows.length || owned.error) && user.email) {
    const byMail = await db.from("tickets").select(COLS).ilike("email", user.email).order("created_at", {
      ascending: false,
    });
    if (!byMail.error) rows = byMail.data ?? [];
  }
  const seen = new Set<string>();
  return rows.filter((row) => {
    if (seen.has(row.id)) return false;
    seen.add(row.id);
    return true;
  });
}
