export function staffOptionLabel(row: { display_name?: string | null; email?: string | null }): string {
  return (row.display_name ?? "").trim() || row.email || "Staff";
}
