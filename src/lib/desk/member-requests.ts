import type { MemberSupportRequest } from "@/lib/desk/tickets";

type Db = {
  from: (table: string) => {
    select: (cols: string) => {
      eq: (col: string, value: string) => {
        order: (
          col: string,
          opts: { ascending: boolean },
        ) => Promise<{ data: MemberSupportRequest[] | null; error: { message?: string } | null }>;
      };
      ilike: (
        col: string,
        value: string,
      ) => {
        order: (
          col: string,
          opts: { ascending: boolean },
        ) => Promise<{ data: MemberSupportRequest[] | null; error: { message?: string } | null }>;
      };
    };
  };
};

const COLS = "id, created_at, enquiry_type, message, status, resolution";

export async function loadMemberSupportRequests(
  db: Db,
  user: { id: string; email?: string | null },
): Promise<MemberSupportRequest[]> {
  const owned = await db.from("tickets").select(COLS).eq("created_by", user.id).order("created_at", {
    ascending: false,
  });
  let rows = owned.error ? [] : owned.data ?? [];
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
