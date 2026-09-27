export function noticeCollapseKey(note: {
  id: string;
  kind: string;
  match_profile_id?: string | null;
}): string {
  if ((note.kind === "profile_view" || note.kind === "contact_view" || note.kind === "match") && note.match_profile_id) {
    return `${note.kind}:${note.match_profile_id}`;
  }
  return note.id;
}

/** Keep the newest row when the same person viewed (or matched) again. */
export function collapseNotices<T extends { id: string; kind: string; match_profile_id?: string | null; created_at: string }>(
  rows: T[],
): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const row of rows) {
    const key = noticeCollapseKey(row);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(row);
  }
  return out;
}
