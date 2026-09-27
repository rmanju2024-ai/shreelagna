type Db = {
  from: (table: string) => {
    select: (cols: string) => { eq: (col: string, value: string) => PromiseLike<{ data: { id: string }[] | null }> };
  };
};

export async function fetchAdminUserIds(db: Db): Promise<Set<string>> {
  const { data } = await db.from("app_users").select("id").eq("role", "admin");
  return new Set((data ?? []).map((row) => row.id));
}

export function ownerIsAdmin(createdBy: unknown, adminIds: Set<string>): boolean {
  return adminIds.has(String(createdBy ?? ""));
}
