import { resolveMembership, type Membership, type PaidRow } from "@/lib/membership/access";
import { SALE_PLANS, mapPlanRow, type PlanCard, type PlanRow } from "@/lib/membership/catalog";
import {
  interestLimitFor,
  quotaWindowStart,
  resolveQuota,
  usedInterestsSince,
  type InterestQuota,
} from "@/lib/membership/quota";

type Filter = {
  eq: (col: string, value: string) => Filter;
  in: (col: string, value: string[]) => Filter & PromiseLike<{ data: unknown[] | null }>;
  order: (col: string, opts: { ascending: boolean }) => Filter;
  limit: (n: number) => Filter;
  maybeSingle: () => PromiseLike<{ data: PaidRow | PlanRow | null }>;
};

type Db = {
  from: (table: string) => {
    select: (cols: string) => Filter & PromiseLike<{ data: PlanRow[] | null }>;
  };
};

export async function fetchPaidMembership(db: Db, userId: string): Promise<PaidRow | null> {
  try {
    const { data } = await db
      .from("memberships")
      .select("plan_code, status, starts_at, ends_at")
      .eq("user_id", userId)
      .eq("status", "active")
      .order("ends_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    return data ?? null;
  } catch {
    return null;
  }
}

export async function fetchPendingPlanCode(db: Db, userId: string): Promise<string | null> {
  try {
    const { data } = await db
      .from("memberships")
      .select("plan_code, status, starts_at, ends_at")
      .eq("user_id", userId)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    return data?.plan_code ?? null;
  } catch {
    return null;
  }
}

export async function fetchPlans(db: Db): Promise<PlanCard[]> {
  try {
    const { data } = await db
      .from("member_plans")
      .select("code, name, tagline, months, price_inr, featured, for_sale, sort_order, perks, interest_limit");
    const rows = (data ?? [])
      .map((row) => mapPlanRow(row))
      .filter((row): row is PlanCard => Boolean(row))
      .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
    return rows.length ? rows : SALE_PLANS;
  } catch {
    return SALE_PLANS;
  }
}

export async function fetchPlanByCode(db: Db, code: string): Promise<PlanCard | null> {
  const plans = await fetchPlans(db);
  return plans.find((plan) => plan.code === code) ?? null;
}

export async function loadInterestQuota(
  db: Db,
  me: { id: string; role?: string | null; welcome_started_at?: string | null; welcome_days?: number | null },
  access: Membership,
  profileIds: string[],
): Promise<InterestQuota> {
  const plan = access.planCode && access.planCode !== "welcome" ? await fetchPlanByCode(db, access.planCode) : null;
  const limit = interestLimitFor(access.kind, plan?.interestLimit);
  if (limit === null) return resolveQuota(null, 0);
  if (!profileIds.length) return resolveQuota(limit, 0);
  const paid = access.kind === "paid" ? await fetchPaidMembership(db, me.id) : null;
  const since = quotaWindowStart(access.kind, {
    welcomeStartedAt: me.welcome_started_at,
    paidStartsAt: paid?.starts_at,
  });
  try {
    const interests = await db.from("interests").select("from_profile_id, created_at").in("from_profile_id", profileIds);
    const views = await db
      .from("contact_views")
      .select("viewer_profile_id, created_at")
      .in("viewer_profile_id", profileIds);
    const interestRows = (interests.data ?? []) as { from_profile_id?: string | null; created_at?: string | null }[];
    const viewRows = ((views.data ?? []) as { viewer_profile_id?: string | null; created_at?: string | null }[]).map(
      (row) => ({ from_profile_id: row.viewer_profile_id, created_at: row.created_at }),
    );
    return resolveQuota(
      limit,
      usedInterestsSince(interestRows, profileIds, since) + usedInterestsSince(viewRows, profileIds, since),
    );
  } catch {
    return resolveQuota(limit, 0);
  }
}

export async function loadMembership(
  db: Db,
  me: {
    id: string;
    role?: string | null;
    welcome_started_at?: string | null;
    welcome_days?: number | null;
  },
): Promise<Membership> {
  const paid = me.role === "admin" || me.role === "service" ? null : await fetchPaidMembership(db, me.id);
  const named = paid?.plan_code ? await fetchPlanByCode(db, paid.plan_code) : null;
  return resolveMembership({
    role: me.role,
    welcomeStartedAt: me.welcome_started_at,
    welcomeDays: me.welcome_days,
    paid,
    planName: named?.name,
  });
}

const NO_PLAN: Membership = {
  kind: "none",
  live: false,
  label: "Plan needed",
  until: null,
  daysLeft: 0,
  planCode: null,
};

export async function loadMembershipForProfile(db: Db, profileId: string): Promise<Membership> {
  try {
    const { data: profile } = await db.from("profiles").select("created_by").eq("id", profileId).maybeSingle();
    const ownerId = String((profile as { created_by?: string | null } | null)?.created_by ?? "");
    if (!ownerId) return NO_PLAN;
    const { data: owner } = await db
      .from("app_users")
      .select("id, role, welcome_started_at, welcome_days")
      .eq("id", ownerId)
      .maybeSingle();
    if (!owner) return NO_PLAN;
    return loadMembership(db, owner as { id: string; role?: string | null; welcome_started_at?: string | null; welcome_days?: number | null });
  } catch {
    return NO_PLAN;
  }
}
