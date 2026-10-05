import { BackToAccount } from "@/components/back-to-account";
import { requestPlan } from "@/app/app/plans/actions";
import { InnerShell as PageShell } from "@/components/chrome-layout";
import { ensureAppUser, getAuth } from "@/lib/auth/session";
import { WELCOME_INTEREST_LIMIT, formatInr, planByCode } from "@/lib/membership/catalog";
import { fetchPendingPlanCode, fetchPlans, loadInterestQuota, loadMembership } from "@/lib/membership/load";
import { formatIstDate } from "@/lib/time/ist";
import { createServiceClient } from "@/lib/supabase/server";
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
      <section className="pl">
        <div className={`pl-status is-${access.kind}`}>
          <div className="pl-status-main">
            <span className="pl-badge">{access.live ? "Your plan" : "No plan"}</span>
            <h1>{access.label}</h1>
            <p>
              {access.live && access.until
                ? `Until ${formatIstDate(access.until)}${access.daysLeft ? ` · ${access.daysLeft} days left` : ""}`
                : access.live
                  ? "Unlimited access"
                  : "Search stays open. Sending interest or viewing contacts needs a plan."}
            </p>
          </div>
          {access.live ? (
            <div className="pl-meter" aria-label="Interests used">
              <b>{quota.limit === null ? "∞" : quota.left ?? 0}</b>
              <small>{quota.limit === null ? "unlimited" : `of ${quota.limit} left`}</small>
            </div>
          ) : null}
        </div>
        {pending || requested || error ? (
          <p className={`pl-note${error ? " is-warn" : ""}`}>
            {error
              ? "Could not save your request. Please try again."
              : pending
                ? `${pending.name} requested. Our team will contact you.`
                : "Request received. Our team will contact you."}
          </p>
        ) : null}

        <ul className="pl-grid">
          {catalog.map((plan) => {
            const on = access.planCode === plan.code;
            const asked = pending?.code === plan.code;
            return (
              <li key={plan.code} className={`pl-card${plan.featured ? " is-featured" : ""}${on ? " is-on" : ""}`}>
                {plan.featured ? <span className="pl-ribbon">★ Recommended</span> : null}
                <p className="pl-months">{plan.months} months</p>
                <h2>{plan.name}</h2>
                <p className="pl-price">
                  {formatInr(plan.priceInr)}
                  <small> indicative</small>
                </p>
                <p className="pl-tag">{plan.tagline}</p>
                <ul className="pl-perks">
                  <li>✔ {plan.interestLimit} interests or views</li>
                  <li>✔ Chat after accept</li>
                </ul>
                {house ? (
                  <p className="pl-tag">Desk already has house access.</p>
                ) : on ? (
                  <p className="pl-live">● This plan is live</p>
                ) : (
                  <form action={requestPlan}>
                    <input type="hidden" name="plan" value={plan.code} />
                    <button type="submit" className="pl-cta">
                      {asked ? "Requested ✓" : access.kind === "paid" ? `Upgrade to ${plan.name}` : `Choose ${plan.name}`}
                    </button>
                  </form>
                )}
              </li>
            );
          })}
        </ul>
        <p className="pl-foot">Welcome gift: {WELCOME_INTEREST_LIMIT} free interests or views for your first 2 months. Chat opens after a match is accepted.</p>
      </section>
    </PageShell>
  );
}
