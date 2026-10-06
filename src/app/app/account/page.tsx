import Link from "next/link";
import { InnerShell as PageShell } from "@/components/chrome-layout";
import { HouseCrest } from "@/components/house-crest";
import { FieldMark } from "@/app/app/profiles/field-mark";
import { ACCOUNT_GROUPS, accountInboxCounts } from "@/lib/account/hub";
import { ensureAppUser, getAuth } from "@/lib/auth/session";
import { planByCode } from "@/lib/membership/catalog";
import { planHeaderMarks, type PlanMark } from "@/lib/membership/account-plan";
import { fetchPendingPlanCode, fetchPlans, loadInterestQuota, loadMembership } from "@/lib/membership/load";
import { monthAgoIso, pulseNote, tallyMonthPulse } from "@/lib/profile/month-pulse";
import { unreadLabel } from "@/lib/match/chat-ui";
import { unreadNoticeBadge } from "@/lib/notices/unread-badge";
import { createServiceClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { cardClass } from "@/lib/ui/classes";

async function loadAccountPulse(
  db: { from: (table: string) => { select: (cols: string, opts?: { count?: string; head?: boolean }) => unknown } },
  profileId: string,
  since: string,
) {
  const client = db as {
    from: (table: string) => {
      select: (cols: string, opts?: { count: "exact"; head: boolean } | undefined) => {
        eq: (col: string, value: string) => {
          gte: (col: string, value: string) => Promise<{ count?: number | null; data?: { created_at?: string | null; status?: string | null; responded_at?: string | null }[] | null }>;
        };
      };
    };
  };
  const [views, received, sent] = await Promise.all([
    client.from("profile_views").select("id", { count: "exact", head: true }).eq("viewed_profile_id", profileId).gte("viewed_at", since),
    client.from("interests").select("created_at, status, responded_at").eq("to_profile_id", profileId).gte("created_at", since),
    client.from("interests").select("created_at, status, responded_at").eq("from_profile_id", profileId).gte("created_at", since),
  ]);
  return tallyMonthPulse({
    views: views.count ?? 0,
    received: received.data ?? [],
    sent: sent.data ?? [],
    since,
  });
}

function MonthPulseCard({
  pulse,
  planMarks,
}: {
  pulse: { views: number; received: number; sent: number; accepted: number; warmth: number } | null;
  planMarks: PlanMark[];
}) {
  const ring = 2 * Math.PI * 26;
  const drawn = pulse ? (pulse.warmth / 100) * ring : 0;
  return (
    <section className="account-pulse" aria-label="Activity and current plan">
      {pulse ? (
        <div className="account-pulse-moon">
          <svg viewBox="0 0 64 64" aria-hidden>
            <circle className="account-pulse-track" cx="32" cy="32" r="26" />
            <circle
              className="account-pulse-glow"
              cx="32"
              cy="32"
              r="26"
              strokeDasharray={`${drawn} ${ring}`}
              transform="rotate(-90 32 32)"
            />
          </svg>
          <p>
            <b>{pulse.warmth}</b>
            <span>warmth</span>
          </p>
        </div>
      ) : null}
      {pulse ? (
        <div className="account-pulse-copy">
          <p className="browse-kicker">Last 30 days</p>
          <h2>{pulseNote(pulse.warmth)}</h2>
          <ul>
            <li>
              <strong>{pulse.views}</strong>
              seen
            </li>
            <li>
              <strong>{pulse.received}</strong>
              received
            </li>
            <li>
              <strong>{pulse.sent}</strong>
              sent
            </li>
            <li>
              <strong>{pulse.accepted}</strong>
              accepted
            </li>
          </ul>
        </div>
      ) : (
        <div className="account-pulse-copy">
          <p className="browse-kicker">Last 30 days</p>
          <h2>Your house is ready.</h2>
        </div>
      )}
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
        </Link>
      ) : null}
    </section>
  );
}

export default async function AccountHubPage() {
  const { supabase, user } = await getAuth();
  if (!supabase || !user) redirect("/login?next=/app/account");
  const me = await ensureAppUser(supabase, user);
  if (!me) redirect("/login?error=account");
  const db = createServiceClient() ?? supabase;
  const since = monthAgoIso();
  const [access, mineRows, pendingCode, plans, inbox] = await Promise.all([
    loadMembership(db, me),
    db.from("profiles").select("id").eq("created_by", me.id),
    fetchPendingPlanCode(db, me.id),
    fetchPlans(db),
    unreadNoticeBadge(me.id).catch(() => ({ chatUnread: 0, alertUnread: 0, likesPending: 0 })),
  ]);
  const mineIds = (mineRows.data ?? []).map((row) => String(row.id));
  const profileId = me.active_profile_id || mineIds[0] || null;
  const [quota, pulse] = await Promise.all([
    loadInterestQuota(db, me, access, mineIds),
    profileId ? loadAccountPulse(db, profileId, since) : Promise.resolve(null),
  ]);
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
        <header className="account-hub-head">
          <span className="account-hub-crest" aria-hidden>
            <HouseCrest />
          </span>
          <div>
            <p className="browse-kicker">Your house</p>
            <h1>Account hub</h1>
          </div>
        </header>
        <MonthPulseCard pulse={pulse} planMarks={planMarks} />
        <div className="account-hub-layout">
          <aside className="account-hub-rail" aria-label="Account sections">
            {ACCOUNT_GROUPS.map((group) => (
              <a key={group.id} href={`#${group.id}`}>
                <FieldMark label={group.mark} />
                {group.title}
              </a>
            ))}
          </aside>
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
        </div>
      </main>
    </PageShell>
  );
}
