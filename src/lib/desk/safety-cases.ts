import { profileKindLabel } from "@/lib/profile/options";

export const SAFETY_CATEGORY_LABELS: Record<string, string> = {
  fake_profile: "Fake profile",
  harassment: "Harassment or threats",
  money_request: "Asked for money",
  inappropriate_content: "Inappropriate content",
  marital_status: "Marital-status concern",
  other: "Something else",
};

export function safetyCategoryLabel(category: string | null | undefined) {
  const key = String(category ?? "").trim();
  return SAFETY_CATEGORY_LABELS[key] ?? (key ? key.replace(/_/g, " ") : "Safety report");
}

export function safetyStatusLabel(status: string | null | undefined) {
  if (status === "in_review") return "In review";
  if (status === "resolved") return "Resolved";
  if (status === "dismissed") return "Dismissed";
  return "New";
}

export type SafetyParty = {
  id: string;
  name: string;
  code: string;
  kind: string;
  email?: string;
  place?: string;
};

export function safetyPartyLabel(party: SafetyParty | undefined, fallbackId?: string) {
  if (!party) return fallbackId ? `Unknown member (${fallbackId.slice(0, 8)})` : "Unknown member";
  return [party.name, party.code, party.kind].filter(Boolean).join(" · ");
}

type MiniDb = {
  from: (table: string) => {
    select: (cols: string) => {
      in: (col: string, values: string[]) => Promise<{ data: Record<string, unknown>[] | null }>;
    };
  };
};

export async function loadSafetyParties(db: MiniDb, ids: string[]): Promise<Map<string, SafetyParty>> {
  const unique = [...new Set(ids.filter(Boolean))];
  const map = new Map<string, SafetyParty>();
  if (!unique.length) return map;
  const { data: profiles } = await db
    .from("profiles")
    .select("id, subject_full_name, member_code, profile_type, current_city, current_state, created_by")
    .in("id", unique);
  const owners = [
    ...new Set((profiles ?? []).map((row) => String(row.created_by ?? "")).filter(Boolean)),
  ];
  const { data: users } = owners.length
    ? await db.from("app_users").select("id, email, display_name").in("id", owners)
    : { data: [] as Record<string, unknown>[] };
  const userById = new Map((users ?? []).map((row) => [String(row.id), row]));
  for (const row of profiles ?? []) {
    const id = String(row.id ?? "");
    if (!id) continue;
    const owner = userById.get(String(row.created_by ?? ""));
    const name =
      (typeof row.subject_full_name === "string" && row.subject_full_name.trim()) ||
      (typeof owner?.display_name === "string" && owner.display_name.trim()) ||
      "Unnamed member";
    const place = [row.current_city, row.current_state].filter((v) => typeof v === "string" && v.trim()).join(", ");
    map.set(id, {
      id,
      name,
      code: typeof row.member_code === "string" ? row.member_code : "",
      kind: profileKindLabel(typeof row.profile_type === "string" ? row.profile_type : ""),
      email: typeof owner?.email === "string" ? owner.email : undefined,
      place: place || undefined,
    });
  }
  return map;
}
