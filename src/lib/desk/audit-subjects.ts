import type { AuditEventRow } from "@/lib/desk/audit-log";

export type AuditSubject = {
  title: string;
  email?: string;
  place?: string;
  plan?: string;
  href?: string;
};

type MiniDb = {
  from: (table: string) => {
    select: (cols: string) => {
      in: (col: string, values: string[]) => Promise<{ data: Record<string, unknown>[] | null }>;
    };
  };
};

function idsOf(rows: AuditEventRow[], type: string) {
  return [...new Set(rows.filter((row) => row.entity_type === type && row.entity_id).map((row) => String(row.entity_id)))];
}

function placeOf(row: Record<string, unknown> | undefined) {
  if (!row) return "";
  return [row.current_city, row.current_state].filter((v) => typeof v === "string" && v.trim()).join(", ");
}

function profileTitle(row: Record<string, unknown> | undefined) {
  if (!row) return "";
  const name = typeof row.subject_full_name === "string" ? row.subject_full_name.trim() : "";
  const code = typeof row.member_code === "string" ? row.member_code.trim() : "";
  const kind = row.profile_type === "vara" ? "Groom" : row.profile_type === "vadhu" ? "Bride" : "";
  return [name || "Member", code, kind].filter(Boolean).join(" · ");
}

export async function loadAuditSubjects(db: MiniDb, rows: AuditEventRow[]): Promise<Map<string, AuditSubject>> {
  const map = new Map<string, AuditSubject>();
  if (!rows.length) return map;

  const profileIds = idsOf(rows, "profile");
  const caseIds = idsOf(rows, "verification_case");
  const memberIds = idsOf(rows, "membership");
  const metaUserIds = [
    ...new Set(
      rows
        .map((row) => row.metadata?.user)
        .filter((id): id is string => typeof id === "string" && id.length > 0),
    ),
  ];

  const [cases, memberships, profilesDirect] = await Promise.all([
    caseIds.length
      ? db.from("profile_verification_cases").select("id, profile_id, document_type").in("id", caseIds)
      : Promise.resolve({ data: [] as Record<string, unknown>[] }),
    memberIds.length
      ? db.from("memberships").select("id, user_id, plan_code").in("id", memberIds)
      : Promise.resolve({ data: [] as Record<string, unknown>[] }),
    profileIds.length
      ? db
          .from("profiles")
          .select("id, subject_full_name, member_code, profile_type, current_city, current_state, created_by")
          .in("id", profileIds)
      : Promise.resolve({ data: [] as Record<string, unknown>[] }),
  ]);

  const caseProfileIds = (cases.data ?? []).map((row) => String(row.profile_id ?? "")).filter(Boolean);
  const membershipUserIds = (memberships.data ?? []).map((row) => String(row.user_id ?? "")).filter(Boolean);
  const extraProfileIds = [...new Set(caseProfileIds)];
  const userIds = [...new Set([...membershipUserIds, ...metaUserIds, ...(profilesDirect.data ?? []).map((row) => String(row.created_by ?? "")).filter(Boolean)])];
  const planCodes = [...new Set((memberships.data ?? []).map((row) => String(row.plan_code ?? "")).filter(Boolean))];

  const [caseProfiles, userProfiles, users, plans] = await Promise.all([
    extraProfileIds.length
      ? db
          .from("profiles")
          .select("id, subject_full_name, member_code, profile_type, current_city, current_state, created_by")
          .in("id", extraProfileIds)
      : Promise.resolve({ data: [] as Record<string, unknown>[] }),
    userIds.length
      ? db
          .from("profiles")
          .select("id, subject_full_name, member_code, profile_type, current_city, current_state, created_by")
          .in("created_by", userIds)
      : Promise.resolve({ data: [] as Record<string, unknown>[] }),
    userIds.length
      ? db.from("app_users").select("id, email, display_name").in("id", userIds)
      : Promise.resolve({ data: [] as Record<string, unknown>[] }),
    planCodes.length
      ? db.from("member_plans").select("code, name").in("code", planCodes)
      : Promise.resolve({ data: [] as Record<string, unknown>[] }),
  ]);

  const profileById = new Map<string, Record<string, unknown>>();
  for (const row of [...(profilesDirect.data ?? []), ...(caseProfiles.data ?? [])]) {
    if (row.id) profileById.set(String(row.id), row);
  }
  const profileByUser = new Map<string, Record<string, unknown>>();
  for (const row of userProfiles.data ?? []) {
    const owner = String(row.created_by ?? "");
    if (owner && !profileByUser.has(owner)) profileByUser.set(owner, row);
  }
  const userById = new Map((users.data ?? []).map((row) => [String(row.id), row]));
  const planByCode = new Map((plans.data ?? []).map((row) => [String(row.code), String(row.name ?? row.code)]));

  function fromProfile(profile: Record<string, unknown> | undefined, userId?: string): AuditSubject {
    const user = userId ? userById.get(userId) : userById.get(String(profile?.created_by ?? ""));
    const title =
      profileTitle(profile) ||
      (typeof user?.display_name === "string" && user.display_name.trim()) ||
      (typeof user?.email === "string" && user.email) ||
      "Member";
    return {
      title,
      email: typeof user?.email === "string" ? user.email : undefined,
      place: placeOf(profile) || undefined,
      href: profile?.id ? `/browse/${profile.id}` : undefined,
    };
  }

  for (const row of profilesDirect.data ?? []) {
    map.set(`profile:${row.id}`, fromProfile(row, String(row.created_by ?? "")));
  }
  for (const row of cases.data ?? []) {
    const profile = profileById.get(String(row.profile_id ?? ""));
    map.set(`verification_case:${row.id}`, fromProfile(profile, String(profile?.created_by ?? "")));
  }
  for (const row of memberships.data ?? []) {
    const userId = String(row.user_id ?? "");
    const profile = profileByUser.get(userId);
    const subject = fromProfile(profile, userId);
    const plan = planByCode.get(String(row.plan_code ?? "")) || String(row.plan_code ?? "");
    map.set(`membership:${row.id}`, { ...subject, plan: plan || undefined });
  }
  return map;
}

export function subjectKey(type: string, id: string | null | undefined) {
  return id ? `${type}:${id}` : "";
}
