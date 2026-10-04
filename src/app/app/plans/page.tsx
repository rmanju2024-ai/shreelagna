import { BackToAccount } from "@/components/back-to-account";
import { requestPlan } from "@/app/app/plans/actions";
import { InnerShell as PageShell } from "@/components/chrome-layout";
import { ensureAppUser, getAuth } from "@/lib/auth/session";
import { WELCOME_INTEREST_LIMIT, formatInr, planByCode } from "@/lib/membership/catalog";
import { fetchPendingPlanCode, fetchPlans, loadInterestQuota, loadMembership } from "@/lib/membership/load";
import { formatIstDate } from "@/lib/time/ist";
import { btnGhost, btnPrimary, cardClass } from "@/lib/ui/classes";
import { createServiceClient } from "@/lib/supabase/server";
import { PageHero } from "@/components/page-hero";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function PlansPage({
  searchParams,
}: {
  searchParams: Promise<{ requested?: string; error?: string }>;
}) {
  const { requested, error } = await searchParams;
  const { supabase, user } = await getAuth();
  if (!supabase || !user) redirect("/login?next=/app/plans");
  const me = await ensureAppUser(supabase, user);
  if (!me) redirect("/login?error=account");
  const db = createServiceClient() ?? supabase;
  const [access, { data: mine }, plans, pendingCode] = await Promise.all([
    loadMembership(db, me),
    db.from("profiles").select("id").eq("created_by", me.id),
    fetchPlans(db),
    fetchPendingPlanCode(db, me.id),
  ]);
  const quota = await loadInterestQuota(
    db,
    me,
    access,
    (mine ?? []).map((row) => row.id),
  );
  const catalog = plans.filter((plan) => plan.forSale);
  const pending = planByCode(pendingCode, catalog);
  const house = access.kind === "house";

  return (
    <PageShell><BackToAccount />
      <section className="plans-stage">
        <PageHero kicker="Membership" title="Plans" sub="Welcome gift on joining. Paid cover thereafter. Chat after accept." />

        <div className={`${cardClass} card-3d plans-now is-${access.kind}`}>
          <p className="browse-kicker">{access.live ? "Current plan" : "No plan"}</p>
          <h2>{access.label}</h2>
          {access.until && access.live ? (
            <p>
              Until {formatIstDate(access.until)}
              {access.daysLeft ? ` · ${access.daysLeft}d left` : ""}
            </p>
          ) : null}
          {access.live && quota.limit !== null ? (
            <p>
              Used {quota.used} · {quota.left ?? 0} pending
            </p>
          ) : access.live ? (
            <p>Unlimited</p>
          ) : null}
          {!access.live ? <p>Search remains open. Interest or contact view needs a plan.</p> : null}
          {pending ? <p className="plans-pending">{pending.name} requested.</p> : null}
          {requested ? <p className="plans-pending">Request received.</p> : null}
          {error ? <p className="plans-warn">Could not save.</p> : null}
        </div>

        <ul className="plans-grid">
          <li className={`${cardClass} card-3d plan-card is-welcome${access.kind === "welcome" ? " is-featured" : ""}`}>
            {access.kind === "welcome" ? <span className="plan-mark">Active</span> : null}
            <p className="browse-kicker">2 months</p>
            <h2>Welcome</h2>
            <p className="plan-price">
              Free
              <small>from joining</small>
            </p>
            <p className="plan-tag">Applied automatically.</p>
            <ul className="plan-perks">
              <li>{WELCOME_INTEREST_LIMIT} interests or views</li>
              <li>Chat after accept</li>
            </ul>
            <p className="plan-on">
              {access.kind === "welcome"
                ? "Live"
                : access.kind === "paid"
                  ? "Completed"
                  : access.kind === "house"
                    ? "House access"
                    : "Ended"}
            </p>
          </li>
          {catalog.map((plan) => {
            const on = access.planCode === plan.code;
            const asked = pending?.code === plan.code;
            return (
              <li key={plan.code} className={`${cardClass} card-3d plan-card${plan.featured ? " is-featured" : ""}`}>
                {plan.featured ? <span className="plan-mark">Recommended</span> : null}
                <p className="browse-kicker">{plan.months} months</p>
                <h2>{plan.name}</h2>
                <p className="plan-price">
                  {formatInr(plan.priceInr)}
                  <small>indicative</small>
                </p>
                <p className="plan-tag">{plan.tagline}</p>
                <ul className="plan-perks">
                  <li>{plan.interestLimit} interests or views</li>
                  <li>Chat after accept</li>
                </ul>
                {house ? (
                  <p className="plan-tag">Desk already has house access.</p>
                ) : on ? (
                  <p className="plan-on">This plan is live</p>
                ) : (
                  <form action={requestPlan}>
                    <input type="hidden" name="plan" value={plan.code} />
                    <button type="submit" className={plan.featured ? btnPrimary : btnGhost}>
                      {asked ? "Requested" : access.kind === "paid" ? `Upgrade to ${plan.name}` : `Choose ${plan.name}`}
                    </button>
                  </form>
                )}
              </li>
            );
          })}
        </ul>
      </section>
    </PageShell>
  );
}
