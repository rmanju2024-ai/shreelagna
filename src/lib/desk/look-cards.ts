import type { BrowseCardNote } from "@/app/browse/browse-card";
import { inboxLastOnline, publicMediaUrl } from "@/lib/match/inbox-card";
import { yearsFromDob } from "@/lib/profile/completeness";
import { formatHeightImperial } from "@/lib/profile/match-compare";
import { displayFirstName } from "@/lib/profile/options";

export const LOOK_LIST_LIMIT = 200;
export const LOOK_STATUSES = ["active", "pending_review", "on_hold", "hidden"];

export function nestedName(value: unknown): string | null {
  if (Array.isArray(value) && value[0] && typeof value[0] === "object" && value[0] && "name" in value[0]) {
    return String((value[0] as { name: unknown }).name);
  }
  if (value && typeof value === "object" && "name" in value) {
    return String((value as { name: unknown }).name);
  }
  return null;
}

export function asText(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

export function lookStatusLine(status: string | null): string {
  if (status === "pending_review") return "In review";
  if (status === "on_hold") return "Paused";
  if (status === "hidden") return "Hidden";
  return "";
}

export function subscribedOwnerIds(
  paid: { user_id?: string | null; ends_at?: string | null }[],
  now = Date.now(),
): Set<string> {
  return new Set(
    paid
      .filter((row) => !row.ends_at || Date.parse(String(row.ends_at)) > now)
      .map((row) => String(row.user_id ?? ""))
      .filter(Boolean),
  );
}

export function lookCardFromRow(
  row: Record<string, unknown>,
  photoMap: Map<string, string>,
  now: number,
): BrowseCardNote {
  const status = asText(row.status);
  const community = nestedName(row.communities);
  const age = typeof row.date_of_birth === "string" ? yearsFromDob(row.date_of_birth) : null;
  const height = typeof row.height_cm === "number" ? formatHeightImperial(row.height_cm) : null;
  return {
    id: String(row.id),
    href: `/browse/${row.id}`,
    name: displayFirstName(typeof row.subject_full_name === "string" ? row.subject_full_name : "Profile"),
    photoUrl: publicMediaUrl(photoMap.get(String(row.id))),
    lastOnline:
      status === "active"
        ? inboxLastOnline(
            Boolean(row.hide_last_seen),
            typeof row.last_seen_at === "string" ? row.last_seen_at : null,
            now,
            "active",
          )
        : lookStatusLine(status),
    age: age != null ? `${age} yrs` : null,
    height,
    religion: nestedName(row.religions),
    community,
    city: asText(row.current_city),
    state: asText(row.current_state) || asText(row.native_state),
    education: asText(row.qualification),
    occupation: asText(row.occupation),
    date_of_birth: asText(row.date_of_birth),
    current_country: asText(row.current_country),
    diet: asText(row.diet),
    income_band: asText(row.income_band),
    profile_type: asText(row.profile_type),
    created_at: asText(row.created_at),
    last_seen_at: asText(row.last_seen_at),
    subscribed: Boolean(row.subscribed),
    score: null,
  };
}
