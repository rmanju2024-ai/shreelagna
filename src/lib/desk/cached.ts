import { unstable_cache } from "next/cache";
import { createdTrend, planUsage } from "@/lib/desk/breakdown";
import { fetchDeskTickets } from "@/lib/desk/ticket-rows";
import { fetchPulseMedia, fetchPulseProfiles, fetchWeekPresence } from "@/lib/desk/pulse-profiles";
import { EMPTY_DESK_PULSE, tallyProfiles, tallyTickets } from "@/lib/desk/stats";
import { daysLeft, welcomeUntil } from "@/lib/membership/access";
import { WELCOME_DAYS } from "@/lib/membership/catalog";
import { fetchPlans } from "@/lib/membership/load";
import { createServiceClient } from "@/lib/supabase/server";
import { istDayKey, istWeekStartKey } from "@/lib/time/ist";

function serviceDb() {
  const db = createServiceClient();
  if (!db) throw new Error("no-service");
  return db;
}

export const cachedDeskTickets = (from: number, to: number) =>
  unstable_cache(
    async () => fetchDeskTickets(serviceDb(), from, to),
    ["desk-tickets", String(from), String(to)],
    { revalidate: 20, tags: ["desk"] },
  )();

export const cachedAuditPage = (from: number, to: number) =>
  unstable_cache(
    async () => {
      const db = serviceDb();
      const [{ data, error }, counted] = await Promise.all([
        db
          .from("audit_events")
          .select("id, at, actor_user_id, actor_role, action, entity_type, entity_id, metadata")
          .in("actor_role", ["service", "admin"])
          .neq("entity_type", "ticket")
          .order("at", { ascending: false })
          .range(from, to),
        db
          .from("audit_events")
          .select("id", { count: "exact", head: true })
          .in("actor_role", ["service", "admin"])
          .neq("entity_type", "ticket"),
      ]);
      const rows = error ? [] : (data ?? []);
      const actorIds = [
        ...new Set(rows.map((row) => row.actor_user_id).filter((id): id is string => Boolean(id))),
      ];
      const actors = actorIds.length
        ? await db.from("app_users").select("id, display_name, email, role").in("id", actorIds)
        : { data: [] };
      return {
        rows,
        total: counted.count ?? rows.length,
        actors: actors.data ?? [],
      };
    },
    ["desk-audit-no-tickets", String(from), String(to)],
    { revalidate: 20, tags: ["desk"] },
  )();

export const cachedStaffRoster = () =>
  unstable_cache(
    async () => {
      const { data } = await serviceDb()
        .from("app_users")
        .select("id, email, display_name, role")
        .in("role", ["service", "admin"])
        .order("display_name");
      return data ?? [];
    },
    ["desk-staff"],
    { revalidate: 30, tags: ["desk"] },
  )();

export const cachedPulseProfiles = () =>
  unstable_cache(
    async () => fetchPulseProfiles(serviceDb()),
    ["desk-pulse-profiles"],
    { revalidate: 30, tags: ["desk"] },
  )();

export const cachedPulseMedia = () =>
  unstable_cache(
    async () => fetchPulseMedia(serviceDb()),
    ["desk-pulse-media"],
    { revalidate: 30, tags: ["desk"] },
  )();

export const cachedWeekPresence = () =>
  unstable_cache(
    async () => {
      const now = new Date();
      return fetchWeekPresence(serviceDb(), istWeekStartKey(now), istDayKey(now));
    },
    ["desk-week-presence"],
    { revalidate: 30, tags: ["desk"] },
  )();

export const cachedDeskPulse = () =>
  unstable_cache(
    async () => {
      const db = serviceDb();
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000).toISOString();
      const welcomeSince = new Date(now.getTime() - WELCOME_DAYS * 24 * 60 * 60 * 1000).toISOString();

      const [
        profileRows,
        ticketRows,
        interestRows,
        views,
        memberCount,
        paidRows,
        welcomeWindow,
        catalog,
        purchaseRows,
      ] = await Promise.all([
        db.from("profiles").select("profile_type, status, created_at").limit(4000),
        db.from("tickets").select("status").limit(2000),
        db.from("interests").select("status").limit(4000),
        db.from("profile_views").select("id", { count: "exact", head: true }).gte("viewed_at", weekAgo),
        db.from("app_users").select("id", { count: "exact", head: true }).eq("role", "member"),
        db.from("memberships").select("user_id, plan_code, ends_at").eq("status", "active").limit(3000),
        db
          .from("app_users")
          .select("id", { count: "exact", head: true })
          .eq("role", "member")
          .gte("welcome_started_at", welcomeSince),
        fetchPlans(db),
        db
          .from("memberships")
          .select("activated_at, starts_at, created_at, status")
          .in("status", ["active", "cancelled"])
          .gte("created_at", yearAgo)
          .limit(3000),
      ]);

      const profiles = (profileRows.data ?? []) as {
        profile_type?: string | null;
        status?: string | null;
        created_at?: string | null;
      }[];
      const tickets = (ticketRows.data ?? []) as { status?: string | null }[];
      const interests = (interestRows.data ?? []) as { status?: string | null }[];
      const pulse = {
        ...EMPTY_DESK_PULSE,
        members: memberCount.count ?? 0,
        ...tallyProfiles(profiles),
        ...tallyTickets(tickets),
        interestsPending: interests.filter((row) => row.status === "pending").length,
        interestsAccepted: interests.filter((row) => row.status === "accepted").length,
        viewsWeek: views.count ?? 0,
      };
      const created = createdTrend(profiles);
      const purchased = createdTrend(
        (
          (purchaseRows.data ?? []) as {
            activated_at?: string | null;
            starts_at?: string | null;
            created_at?: string | null;
            status?: string | null;
          }[]
        ).flatMap((row) => {
          const at = row.activated_at || row.starts_at || (row.status === "active" ? row.created_at : null);
          return at ? [{ created_at: at }] : [];
        }),
        now,
      );
      const paid = (paidRows.data ?? []) as {
        user_id?: string | null;
        plan_code?: string | null;
        ends_at?: string | null;
      }[];
      const livePaidIds = [
        ...new Set(
          paid
            .filter((row) => !row.ends_at || new Date(row.ends_at).getTime() > now.getTime())
            .map((row) => String(row.user_id ?? "").trim())
            .filter(Boolean),
        ),
      ];
      const paidPeople = livePaidIds.length
        ? await db.from("app_users").select("id, welcome_started_at, welcome_days").in("id", livePaidIds.slice(0, 500))
        : { data: [] as { welcome_started_at?: string | null; welcome_days?: number | null }[] };
      const paidWelcomeOverlap = (paidPeople.data ?? []).filter(
        (row) => daysLeft(welcomeUntil(row.welcome_started_at, row.welcome_days ?? WELCOME_DAYS, now), now) > 0,
      ).length;
      const usage = planUsage({
        memberCount: memberCount.count ?? 0,
        welcomeWindowCount: welcomeWindow.count ?? 0,
        paid,
        paidWelcomeOverlap,
        catalog,
        now,
      });
      return { pulse, created, purchased, usage };
    },
    ["desk-pulse"],
    { revalidate: 20, tags: ["desk"] },
  )();
