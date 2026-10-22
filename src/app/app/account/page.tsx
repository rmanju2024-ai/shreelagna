import Link from "next/link";
import { InnerShell as PageShell } from "@/components/chrome-layout";
import { HouseCrest } from "@/components/house-crest";
import { FieldMark } from "@/app/app/profiles/field-mark";
import { ACCOUNT_GROUPS, accountInboxCounts, accountOwnerName } from "@/lib/account/hub";
import { ensureAppUser, getAuth } from "@/lib/auth/session";
import { planByCode } from "@/lib/membership/catalog";
import { planHeaderMarks, type PlanMark } from "@/lib/membership/account-plan";
import { fetchPendingPlanCode, fetchPlans, loadInterestQuota, loadMembership } from "@/lib/membership/load";
import { unreadLabel } from "@/lib/match/chat-ui";
import { unreadNoticeBadge } from "@/lib/notices/unread-badge";
import { createServiceClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { cardClass } from "@/lib/ui/classes";
import { QuotaSoftBeacon } from "@/components/quota-soft-toast";
import { buildQuotaSoftNotice } from "@/lib/membership/quota-notice";

function AccountHubHead({
  planMarks,
  ownerName,
}: {
  planMarks: PlanMark[];
  ownerName: string | null;
}) {
  return (
    <header className="account-hub-head" aria-label="Account overview">
      <span className="account-hub-crest" aria-hidden>
        <HouseCrest />
      </span>
      <div className="account-hub-copy">
        <h1>Account hub</h1>
      </div>
      {planMarks.length ? (
        <Link href="/app/plans" className="account-pulse-plan">
          <p className="browse-kicker">Current plan</p>
          <ul>
            {planMarks.map((mark) => (
              <li key={mark.id} className={`is-${mark.tone}`}>
                <span>{mark.hint}</span>
                <strong>{mark.text}</strong>
              </li>
            ))}
          </ul>
          <small>Profiles used = unique profiles you viewed or sent interest to.</small>
        </Link>
      ) : null}
      {ownerName ? (
        <p className="account-hub-owner">
          <span>Profile</span>
          <strong>{ownerName}</strong>
        </p>
      ) : null}
    </header>
  );
}

export default async function AccountHubPage() {
  const { supabase, user } = await getAuth();
  if (!supabase || !user) redirect("/login?next=/app/account");
  const me = await ensureAppUser(supabase, user);
  if (!me) redirect("/login?error=account");
  const db = createServiceClient() ?? supabase;
  const [access, mineRows, pendingCode, plans, inbox] = await Promise.all([
    loadMembership(db, me),
    db.from("profiles").select("id, subject_full_name").eq("created_by", me.id),
    fetchPendingPlanCode(db, me.id),
    fetchPlans(db),
    unreadNoticeBadge(me.id).catch(() => ({ chatUnread: 0, alertUnread: 0, likesPending: 0 })),
  ]);
  const mineIds = (mineRows.data ?? []).map((row) => String(row.id));
  const ownerName = accountOwnerName(mineRows.data ?? [], me.active_profile_id, me.display_name);
  const quota = await loadInterestQuota(db, me, access, mineIds);
  const inboxCounts = accountInboxCounts(inbox);
  const pending = planByCode(pendingCode, plans.filter((plan) => plan.forSale));
  const planMarks = planHeaderMarks({
    access,
    pendingName: pending?.name ?? null,
    used: quota.used,
    limit: quota.limit,
  });
  return (
    <PageShell>
      <main className="account-hub sx-stage">
        <QuotaSoftBeacon onceKey="mc-quota-visit" notice={buildQuotaSoftNotice(access, quota, "visit")} />
        <AccountHubHead planMarks={planMarks} ownerName={ownerName} />
        <div className="account-hub-content">
          {ACCOUNT_GROUPS.map((group) => (
            <section id={group.id} key={group.id} className="account-hub-section">
              <p className="account-hub-section-kicker">{group.kicker}</p>
              <h2>
                <FieldMark label={group.mark} />
                {group.title}
              </h2>
              <div className={`account-hub-grid${"columns" in group && group.columns === 3 ? " is-trio" : ""}`}>
                {group.items.map((item) => {
                  const count = inboxCounts[item.href] ?? 0;
                  const mark = unreadLabel(count);
                  return (
                  <Link key={item.href} href={item.href} className={`${cardClass} account-hub-card`}>
                    {mark ? <b className="account-hub-badge">{mark}</b> : null}
                    <em className="account-hub-ico" aria-hidden>
                      <FieldMark label={item.mark} />
                    </em>
                    <h3>{item.title}</h3>
                    <p>{item.text}</p>
                    <span>Open</span>
                  </Link>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </main>
    </PageShell>
  );
}
