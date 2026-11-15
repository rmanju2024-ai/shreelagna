export const PEOPLE_SORTS = [
  { id: "newest", label: "Newest first", column: "created_at", ascending: false },
  { id: "oldest", label: "Oldest first", column: "created_at", ascending: true },
  { id: "updated", label: "Recently updated", column: "updated_at", ascending: false },
  { id: "active", label: "Recently active", column: "last_seen_at", ascending: false },
  { id: "name", label: "Name A–Z", column: "subject_full_name", ascending: true },
  { id: "code", label: "Member ID", column: "member_code", ascending: true },
  { id: "place", label: "City A–Z", column: "current_city", ascending: true },
  { id: "status", label: "Status", column: "status", ascending: true },
] as const;

export type PeopleSortId = (typeof PEOPLE_SORTS)[number]["id"];

export function parsePeopleSort(raw?: string | null): PeopleSortId {
  return PEOPLE_SORTS.some((item) => item.id === raw) ? (raw as PeopleSortId) : "newest";
}

export function peopleSortSpec(id: PeopleSortId = "newest") {
  return PEOPLE_SORTS.find((item) => item.id === id) ?? PEOPLE_SORTS[0];
}
