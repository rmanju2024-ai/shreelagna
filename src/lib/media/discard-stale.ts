export function staleMediaRows<T extends { id: string; storage_path?: string | null }>(
  rows: T[],
  keepIds: Iterable<string>,
): T[] {
  const keep = new Set([...keepIds].filter(Boolean));
  return rows.filter((row) => row.id && !keep.has(row.id) && Boolean(row.storage_path));
}

export async function removeStaleMedia(
  supabase: { from: (table: string) => any; storage: { from: (bucket: string) => { remove: (paths: string[]) => Promise<unknown> } } },
  rows: { id: string; storage_path?: string | null }[],
) {
  const stale = rows.filter((row) => row.id && row.storage_path);
  if (!stale.length) return;
  await supabase.from("media").delete().in("id", stale.map((row) => row.id));
  await supabase.storage.from("profile-media").remove(stale.map((row) => String(row.storage_path)));
}
