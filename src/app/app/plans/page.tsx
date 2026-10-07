import { BackToAccount } from "@/components/back-to-account";
import { requestPlan } from "@/app/app/plans/actions";
import { InnerShell as PageShell } from "@/components/chrome-layout";
import { ensureAppUser, getAuth } from "@/lib/auth/session";
import { WELCOME_INTEREST_LIMIT, WELCOME_PLAN_NAME, formatInr, planBenefitLines, planByCode } from "@/lib/membership/catalog";
import { fetchPendingPlanCode, fetchPlans, loadInterestQuota, loadMembership } from "@/lib/membership/load";
import { formatIstDate } from "@/lib/time/ist";
import { createServiceClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { profileOpenHref } from "@/lib/ui/dismiss";

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
  const { data: touchRows } = quota.touchedIds.length
    ? await db.from("profiles").select("id, subject_full_name, member_code").in("id", quota.touchedIds)
    : { data: [] as { id: string; subject_full_name?: string | null; member_code?: string | null }[] };
  const catalog = plans.filter((plan) => plan.forSale);
  const pending = planByCode(pendingCode, catalog);
  const house = access.kind === "house";

  return (
    <PageShell><BackToAccount />
      <section className="plans-stage">
        <div className="plans-header">
          <p className="browse-kicker">Membership</p>
          <h1>Plans</h1>
          <p className="plans-intro">Welcome gift on joining, then paid cover. Chat is available when you send interest.</p>
        </div>

        <div className={`plans-status is-${access.kind}`}>
          <div>
            <span className="plans-label">{access.live ? "Current plan" : "No plan"}</span>
            <h2>{access.label}</h2>
            {access.until ? (
              <p>
                Until {formatIstDate(access.until)}
                {access.daysLeft ? ` · ${access.daysLeft}d left` : ""}
              </p>
            ) : null}
            {access.live && quota.limit !== null ? (
              <p>
                Used {quota.used} of {quota.limit} · {quota.left ?? 0} left
              </p>
            ) : access.live ? (
              <p>Unlimited</p>
            ) : (
              <p>Search remains open. A send request or contact view needs a plan.</p>
            )}
          </div>
          {access.live && quota.limit !== null ? (
            <div className="plans-meter">
              <b>{quota.left ?? 0}</b>
              <small>left</small>
            </div>
          ) : null}
        </div>

        {access.live && quota.limit !== null ? (
          <details className="plans-usage">
            <summary>How this count works · click for more details</summary>
            <p>
              Interest sent or contact viewed on the same family is one count. A later action on that family is not counted again.
            </p>
            <p>
              This period: {quota.used} used · {quota.left ?? 0} left of {quota.limit}.
            </p>
            {quota.touchedIds.length ? (
              <ul className="plans-usage-list">
                {(touchRows ?? []).map((row) => (
                  <li key={row.id}>
                    <a href={profileOpenHref(row.id, "plans")}>
                      {row.subject_full_name?.trim() || row.member_code || "Profile"}
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No profiles counted yet this period.</p>
            )}
          </details>
        ) : null}

        {pending || requested || error ? (
          <p className={`plans-msg${error ? " is-error" : ""}`}>
            {error
              ? "Could not save your request. Please try again."
              : pending
                ? `${pending.name} requested. Our team will contact you.`
                : "Request received. Our team will contact you."}
          </p>
        ) : null}

        <div className="plans-welcome-banner">
          <div>
            <h3>🎁 {WELCOME_PLAN_NAME}</h3>
            <p>
              {WELCOME_INTEREST_LIMIT} families in the first 2 months. Interest sent or contact viewed on the same family is one count.
            </p>
          </div>
        </div>

        <ul className="plans-grid">
          <li className="plans-card is-welcome">
            <span className="plans-mark">{access.kind === "welcome" ? "Active" : "Automatic"}</span>
            <p className="plans-months">2 months</p>
            <h2>{WELCOME_PLAN_NAME}</h2>
            <p className="plans-price">Free <small>from joining</small></p>
            <p className="plans-desc">Applied automatically.</p>
            <ul className="plans-benefits">
              {planBenefitLines(WELCOME_INTEREST_LIMIT).map((line) => (
                <li key={line}>✔ {line}</li>
              ))}
            </ul>
            <p className="plans-status-badge">{access.kind === "welcome" ? "Live now" : "Completed"}</p>
          </li>

          {catalog.map((plan) => {
            const on = access.planCode === plan.code;
            const asked = pending?.code === plan.code;
            return (
              <li key={plan.code} className={`plans-card${plan.featured ? " is-featured" : ""}${on ? " is-active" : ""}`}>
                {plan.featured ? <span className="plans-mark">Recommended</span> : null}
                <p className="plans-months">{plan.months} months</p>
                <h2>{plan.name}</h2>
                <p className="plans-price">{formatInr(plan.priceInr)} <small>indicative</small></p>
                <p className="plans-desc">{plan.tagline}</p>
                <ul className="plans-benefits">
                  {planBenefitLines(plan.interestLimit).map((line) => (
                    <li key={line}>✔ {line}</li>
                  ))}
                </ul>
                {house ? (
                  <p className="plans-note">Desk already has house access.</p>
                ) : on ? (
                  <p className="plans-status-badge">This plan is live</p>
                ) : (
                  <form action={requestPlan}>
                    <input type="hidden" name="plan" value={plan.code} />
                    <button type="submit" className={`plans-btn${plan.featured ? " is-primary" : ""}`}>
                      {asked ? "Requested ✓" : access.kind === "paid" ? `Upgrade to ${plan.name}` : `Choose ${plan.name}`}
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
