import { resolveMembership, type Membership, type PaidRow } from "@/lib/membership/access";
import { SALE_PLANS, mapPlanRow, type PlanCard, type PlanRow } from "@/lib/membership/catalog";
import {
  interestLimitFor,
  newFamiliesOnDay,
  quotaWindowStart,
  resolveQuota,
  usedUniqueProfilesSince,
  withBonusSlots,
  type InterestQuota,
} from "@/lib/membership/quota";
import { workingProfileId } from "@/lib/profile/working-profile";
import { istDayStart } from "@/lib/time/ist";

type Query = {
  eq: (col: string, value: string) => Query;
  in: (col: string, value: string[]) => Query & PromiseLike<{ data: unknown[] | null; error?: unknown }>;
  order: (col: string, opts: { ascending: boolean }) => Query & PromiseLike<{ data: unknown[] | null; error?: unknown }>;
  limit: (n: number) => Query;
  maybeSingle: () => PromiseLike<{ data: unknown }>;
};

type Db = {
  from: (table: string) => {
    select: (cols: string) => Query & PromiseLike<{ data: unknown[] | null; error?: unknown }>;
  };
};

function asDb(db: unknown): Db {
  return db as Db;
}

async function membershipRow(
  db: unknown,
  userId: string,
  status: "active" | "pending",
  profileId?: string | null,
): Promise<(PaidRow & { profile_id?: string | null }) | null> {
  const orderCol = status === "pending" ? "created_at" : "ends_at";
  try {
    let query = asDb(db)
      .from("memberships")
      .select("plan_code, status, starts_at, ends_at, profile_id")
      .eq("user_id", userId)
      .eq("status", status);
    if (profileId) query = query.eq("profile_id", profileId);
    const { data } = await query.order(orderCol, { ascending: false }).limit(1).maybeSingle();
    return (data as PaidRow & { profile_id?: string | null }) ?? null;
  } catch {
    return null;
  }
}

export async function fetchPaidMembership(
  db: unknown,
  userId: string,
  profileId?: string | null,
): Promise<PaidRow | null> {
  const live = await membershipRow(db, userId, "active", profileId);
  if (live) return live;
  try {
    let query = asDb(db)
      .from("memberships")
      .select("plan_code, status, starts_at, ends_at, profile_id")
      .eq("user_id", userId);
    if (profileId) query = query.eq("profile_id", profileId);
    const { data } = await query.order("ends_at", { ascending: false }).limit(1).maybeSingle();
    return (data as PaidRow | null) ?? null;
  } catch {
    return null;
  }
}

export async function fetchPendingPlanCode(
  db: unknown,
  userId: string,
  profileId?: string | null,
): Promise<string | null> {
  const row = await membershipRow(db, userId, "pending", profileId);
  return row?.plan_code ?? null;
}

export async function fetchPlans(db: unknown): Promise<PlanCard[]> {
  try {
    const { data } = await asDb(db)
      .from("member_plans")
      .select("code, name, tagline, months, price_inr, featured, for_sale, sort_order, perks, interest_limit");
    const rows = ((data ?? []) as PlanRow[])
      .map((row) => mapPlanRow(row))
      .filter((row): row is PlanCard => Boolean(row));
    const byCode = new Map(rows.map((plan) => [plan.code, plan]));
    for (const plan of SALE_PLANS) {
      if (!byCode.has(plan.code)) byCode.set(plan.code, plan);
    }
    return [...byCode.values()].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
  } catch {
    return SALE_PLANS;
  }
}

export async function fetchPlanByCode(db: unknown, code: string): Promise<PlanCard | null> {
  const plans = await fetchPlans(db);
  return plans.find((plan) => plan.code === code) ?? null;
}

export async function loadInterestQuota(
  db: unknown,
  me: { id: string; role?: string | null; welcome_started_at?: string | null; welcome_days?: number | null },
  access: Membership,
  profileIds: string[],
): Promise<InterestQuota> {
  const plan = access.planCode && access.planCode !== "welcome" ? await fetchPlanByCode(db, access.planCode) : null;
  const bonus = await readInterestBonus(db, me.id);
  const limit = withBonusSlots(interestLimitFor(access.kind, plan?.interestLimit), bonus);
  if (!profileIds.length) return resolveQuota(limit, 0);
  const paid = access.kind === "paid" ? await fetchPaidMembership(db, me.id, profileIds[0]) : null;
  let welcomeStartedAt = me.welcome_started_at;
  if (access.kind === "welcome" && profileIds[0]) {
    try {
      const { data: born } = await asDb(db)
        .from("profiles")
        .select("created_at")
        .eq("id", profileIds[0])
        .maybeSingle();
      const at = (born as { created_at?: string | null } | null)?.created_at;
      if (at) welcomeStartedAt = at;
    } catch {
      /* keep account welcome date */
    }
  }
  const since = quotaWindowStart(access.kind, {
    welcomeStartedAt,
    paidStartsAt: paid?.starts_at,
  });
  try {
    const [interests, views] = await Promise.all([
      asDb(db)
        .from("interests")
        .select("from_profile_id, to_profile_id, created_at")
        .in("from_profile_id", profileIds),
      asDb(db)
        .from("contact_views")
        .select("viewer_profile_id, viewed_profile_id, created_at")
        .in("viewer_profile_id", profileIds),
    ]);
    if (interests.error || views.error) return resolveQuota(limit, limit ?? 0);
    const interestRows = (interests.data ?? []) as {
      from_profile_id?: string | null;
      to_profile_id?: string | null;
      created_at?: string | null;
    }[];
    const viewRows = (views.data ?? []) as {
      viewer_profile_id?: string | null;
      viewed_profile_id?: string | null;
      created_at?: string | null;
    }[];
    const touchedIds = usedUniqueProfilesSince(interestRows, viewRows, profileIds, since);
    const dailyIds = newFamiliesOnDay(interestRows, viewRows, profileIds, istDayStart(), since);
    return resolveQuota(limit, touchedIds.length, touchedIds, dailyIds.length, access.kind === "house");
  } catch {
    return resolveQuota(limit, limit ?? 0);
  }
}

async function readInterestBonus(db: unknown, userId: string): Promise<number> {
  try {
    const { data } = await asDb(db).from("app_users").select("interest_bonus").eq("id", userId).maybeSingle();
    const n = Number((data as { interest_bonus?: number | null } | null)?.interest_bonus);
    return Number.isFinite(n) && n > 0 ? Math.round(n) : 0;
  } catch {
    return 0;
  }
}

export type MembershipMe = {
  id: string;
  role?: string | null;
  welcome_started_at?: string | null;
  welcome_days?: number | null;
  active_profile_id?: string | null;
};

export async function loadMembership(
  db: unknown,
  me: MembershipMe,
  profile?: { id?: string | null; created_at?: string | null } | null,
): Promise<Membership> {
  const profileId = profile?.id ?? null;
  if (me.role !== "admin" && me.role !== "service" && !profileId) {
    return NO_PLAN;
  }
  const paid =
    me.role === "admin" || me.role === "service" ? null : await fetchPaidMembership(db, me.id, profileId);
  const named = paid?.plan_code ? await fetchPlanByCode(db, paid.plan_code) : null;
  return resolveMembership({
    role: me.role,
    welcomeStartedAt: profile?.created_at ?? null,
    welcomeDays: me.welcome_days,
    paid,
    planName: named?.name,
  });
}

export async function loadWorkingMembership(
  db: unknown,
  me: MembershipMe,
): Promise<{ access: Membership; profileId: string | null; createdAt: string | null }> {
  try {
    const { data } = await asDb(db)
      .from("profiles")
      .select("id, created_at")
      .eq("created_by", me.id)
      .order("created_at", { ascending: true });
    const listed = (data ?? []) as { id: string; created_at?: string | null }[];
    const profileId = workingProfileId(me.active_profile_id, listed.map((row) => row.id));
    const row = listed.find((item) => item.id === profileId) ?? (listed.length === 1 ? listed[0] : null);
    const access = await loadMembership(db, me, row);
    return { access, profileId: row?.id ?? null, createdAt: row?.created_at ?? null };
  } catch {
    const access = await loadMembership(db, me);
    return { access, profileId: me.active_profile_id ?? null, createdAt: me.welcome_started_at ?? null };
  }
}

const NO_PLAN: Membership = {
  kind: "none",
  live: false,
  lapsed: false,
  label: "Plan needed",
  until: null,
  daysLeft: 0,
  planCode: null,
};

export async function loadMembershipForProfile(db: unknown, profileId: string): Promise<Membership> {
  try {
    const { data: profile } = await asDb(db)
      .from("profiles")
      .select("created_by, created_at")
      .eq("id", profileId)
      .maybeSingle();
    const ownerId = String((profile as { created_by?: string | null } | null)?.created_by ?? "");
    if (!ownerId) return NO_PLAN;
    const { data: owner } = await asDb(db)
      .from("app_users")
      .select("id, role, welcome_started_at, welcome_days")
      .eq("id", ownerId)
      .maybeSingle();
    if (!owner) return NO_PLAN;
    return loadMembership(db, owner as MembershipMe, {
      id: profileId,
      created_at: (profile as { created_at?: string | null }).created_at,
    });
  } catch {
    return NO_PLAN;
  }
}
