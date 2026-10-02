import { lastOnlineLine } from "@/lib/profile/last-seen";
import { photosVisible } from "@/lib/match/photo-privacy";

export const PROFILE_PAGE_SIZE = 20;

export function pageCount(total: number, size = PROFILE_PAGE_SIZE): number {
  return Math.max(1, Math.ceil(Math.max(0, total) / size));
}

export function pageItems<T>(items: T[], page: number, size = PROFILE_PAGE_SIZE): T[] {
  const total = pageCount(items.length, size);
  const current = Math.min(Math.max(1, page), total);
  const start = (current - 1) * size;
  return items.slice(start, start + size);
}

export function inboxLastOnline(
  hide: boolean | null | undefined,
  iso: string | null | undefined,
  now = Date.now(),
  status?: string | null,
): string {
  if (status === "hidden") return "Profile is set Hidden";
  if (status != null && status !== "active") return "Profile is set Deleted";
  if (hide) return "Last online hidden";
  return lastOnlineLine(iso, null, now) ?? "Online —";
}

/** Render-safe convenience for server components that do not need a fixed test clock. */
export function inboxLastOnlineNow(
  hide: boolean | null | undefined,
  iso: string | null | undefined,
  status?: string | null,
): string {
  return inboxLastOnline(hide, iso, Date.now(), status);
}

export function inboxPhotoPath(args: {
  path?: string | null;
  hideUntilAccept?: boolean | null;
  accepted?: boolean;
  interestReceived?: boolean;
}): string | null {
  if (!args.path) return null;
  if (
    !photosVisible({
      hideUntilAccept: args.hideUntilAccept,
      accepted: args.accepted,
      interestReceived: args.interestReceived,
    })
  ) {
    return null;
  }
  return args.path;
}

export function publicMediaUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  if (!base) return null;
  return `${base}/storage/v1/object/public/profile-media/${path}`;
}

export type PrimaryPhotoRow = {
  profile_id: string;
  storage_path: string | null;
  is_primary?: boolean | null;
};

export function pickPrimaryPhotoMap(rows: PrimaryPhotoRow[]): Map<string, string> {
  const first = new Map<string, string>();
  const primary = new Map<string, string>();
  for (const row of rows) {
    const path = row.storage_path?.trim();
    if (!path) continue;
    if (!first.has(row.profile_id)) first.set(row.profile_id, path);
    if (row.is_primary) primary.set(row.profile_id, path);
  }
  for (const [id, path] of primary) first.set(id, path);
  return first;
}
