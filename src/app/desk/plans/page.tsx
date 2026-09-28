import { addPlan, confirmPlan, declinePlan, grantPlan, savePlan } from "@/app/desk/plans/actions";
import { DeskPager } from "@/app/desk/desk-pager";
import { requireDesk } from "@/lib/desk/access";
import { deskPage, deskRange } from "@/lib/desk/pager";
import { formatInr, perkText, planByCode, type PlanCard } from "@/lib/membership/catalog";
import { fetchPlans } from "@/lib/membership/load";
import { createServiceClient } from "@/lib/supabase/server";
import { formatIstDateTime } from "@/lib/time/ist";
import { btnGhost, btnPrimary, cardClass, inputClass } from "@/lib/ui/classes";

function PlanFields({ plan }: { plan?: PlanCard }) {
  return (
    <>
      {!plan ? (
        <label className="desk-ticket-note-label">
          Code
          <input name="code" required className={inputClass} placeholder="pearl" />
        </label>
      ) : (
        <input type="hidden" name="code" value={plan.code} />
      )}
      <label className="desk-ticket-note-label">
        Name
        <input name="name" required className={inputClass} defaultValue={plan?.name ?? ""} />
      </label>
      <label className="desk-ticket-note-label">
        Months
        <input name="months" type="number" min={1} max={36} required className={inputClass} defaultValue={plan?.months ?? 6} />
      </label>
      <label className="desk-ticket-note-label">
        Price (INR)
        <input name="price" type="number" min={0} max={999999} required className={inputClass} defaultValue={plan?.priceInr ?? 0} />
      </label>
      <label className="desk-ticket-note-label">
        Sort
        <input name="sort_order" type="number" className={inputClass} defaultValue={plan?.sortOrder ?? 10} />
      </label>
      <label className="desk-ticket-note-label">
        View cap
        <input
          name="interest_limit"
          type="number"
          min={1}
          max={9999}
          required
          className={inputClass}
          defaultValue={plan?.interestLimit ?? 80}
        />
      </label>
      <label className="desk-ticket-note-label plan-edit-wide">
        Tagline
        <input name="tagline" className={inputClass} defaultValue={plan?.tagline ?? ""} />
      </label>
      <label className="desk-ticket-note-label plan-edit-wide">
        Perks (one per line)
        <textarea name="perks" rows={4} className={inputClass} defaultValue={plan ? perkText(plan.perks) : ""} />
      </label>
      <label className="plan-check">
        <input type="checkbox" name="featured" defaultChecked={plan?.featured} />
        Recommended
      </label>
      <label className="plan-check">
        <input type="checkbox" name="for_sale" defaultChecked={plan ? plan.forSale : true} />
        On sale
      </label>
    </>
  );
}

type Row = {
  id: string;
  user_id: string;
  plan_code: string;
  source: string;
  status: string;
  created_at: string;
  ends_at: string | null;
};

export default async function DeskPlansPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const desk = await requireDesk("/desk/plans");
  if (!desk.allowed) return null;
  const { page: rawPage } = await searchParams;
  const page = deskPage(rawPage);
  const { from, to } = deskRange(page);
  const db = createServiceClient() ?? desk.supabase;
  const [catalog, listed, pendingCount, liveCount] = await Promise.all([
    fetchPlans(db),
    db
      .from("memberships")
      .select("id, user_id, plan_code, source, status, created_at, ends_at", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to),
    db.from("memberships").select("id", { count: "exact", head: true }).eq("status", "pending"),
    db.from("memberships").select("id", { count: "exact", head: true }).eq("status", "active"),
  ]);
  const list = (listed.data ?? []) as Row[];
  const total = listed.count ?? list.length;
  const userIds = [...new Set(list.map((row) => row.user_id))];
  const { data: people } = userIds.length
    ? await db.from("app_users").select("id, email, display_name").in("id", userIds)
    : { data: [] as { id: string; email: string; display_name: string | null }[] };
  const names = new Map((people ?? []).map((row) => [row.id, row]));
  const pending = pendingCount.count ?? 0;
  const live = liveCount.count ?? 0;

  return (
    <section className="desk-panel">
      <header className="desk-panel-head">
        <div>
          <p className="browse-kicker">Plans</p>
          <h2>Welcome gift, then paid cover</h2>
        </div>
        <p>
          {pending} waiting · {live} live
        </p>
      </header>
      <p className="browse-saved-note">
        Welcome is automatic for two months from joining, with 20 interests or contact views. Admin can rewrite names,
        prices, months, view caps, and add new plans. Chat needs an accepted interest.
        Confirm a request after UPI, or grant a plan by Gmail. Do not grant onto an admin account.
      </p>
      {desk.admin ? (
        <div className="plan-edit-stack">
          <h3 className="plan-edit-title">Catalog</h3>
          {catalog.map((plan) => (
            <form key={plan.code} action={savePlan} className={`${cardClass} plan-edit-form`}>
              <p className="browse-kicker">{plan.code}</p>
              <PlanFields plan={plan} />
              <button type="submit" className={btnPrimary}>
                Save {plan.name}
              </button>
            </form>
          ))}
          <form action={addPlan} className={`${cardClass} plan-edit-form`}>
            <p className="browse-kicker">New plan</p>
            <PlanFields />
            <button type="submit" className={btnGhost}>
              Add plan
            </button>
          </form>
        </div>
      ) : null}
      <form action={grantPlan} className="desk-ticket-note-form plans-grant">
        <label className="desk-ticket-note-label">
          Member Gmail
          <input name="email" type="email" required className={inputClass} placeholder="name@gmail.com" />
        </label>
        <label className="desk-ticket-note-label">
          Plan
          <select name="plan" className={inputClass} defaultValue="gold">
            {catalog.map((plan) => (
              <option key={plan.code} value={plan.code}>
                {plan.name} · {plan.months} mo · {formatInr(plan.priceInr)}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className={btnPrimary}>
          Grant plan
        </button>
      </form>
      <ul className="desk-staff-list">
        {list.length ? (
          list.map((row) => {
            const person = names.get(row.user_id);
            const plan = planByCode(row.plan_code, catalog);
            return (
              <li key={row.id} className={`${cardClass} card-3d desk-ticket-row`}>
                <span className="desk-ticket-row-main">
                  <span className="desk-ticket-row-head">
                    <span className="desk-ticket-name">{person?.display_name || person?.email || row.user_id}</span>
                    <span className={`desk-pill ${row.status === "active" ? "is-done" : row.status === "pending" ? "is-open" : ""}`}>
                      {row.status}
                    </span>
                  </span>
                  <span className="desk-ticket-meta">
                    {plan?.name ?? row.plan_code} · {row.source} · {formatIstDateTime(row.created_at)}
                    {row.ends_at ? ` · until ${formatIstDateTime(row.ends_at)}` : ""}
                  </span>
                  <span className="desk-ticket-preview">{person?.email}</span>
                </span>
                {row.status === "pending" ? (
                  <span className="plans-desk-actions">
                    <form action={confirmPlan}>
                      <input type="hidden" name="id" value={row.id} />
                      <button type="submit" className={btnPrimary}>
                        Confirm
                      </button>
                    </form>
                    <form action={declinePlan}>
                      <input type="hidden" name="id" value={row.id} />
                      <button type="submit" className={btnGhost}>
                        Decline
                      </button>
                    </form>
                  </span>
                ) : null}
              </li>
            );
          })
        ) : (
          <li className="desk-empty">No plan requests yet. Welcome gifts do not appear here.</li>
        )}
      </ul>
      <DeskPager path="/desk/plans" page={page} count={total} />
    </section>
  );
}
