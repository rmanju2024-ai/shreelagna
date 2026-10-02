import { Suspense } from "react";
import { PageHero } from "@/components/page-hero";
import { PageShell } from "@/components/site-chrome";
import { DeskNav } from "@/app/desk/desk-nav";
import { DeskPaneFallback } from "@/app/desk/desk-fallback";
import { requireDesk } from "@/lib/desk/access";

export default async function DeskLayout({ children }: { children: React.ReactNode }) {
  const desk = await requireDesk();
  if (!desk.allowed) {
    return (
      <PageShell>
        <div className="sx-stage public-stage">
          <PageHero
            kicker="Private workspace"
            title="Staff access needed"
            sub="This desk is reserved for family operators. Ask an admin to add the service role to your Gmail."
          />
          <div className="gz-empty-state">
            <span className="gz-empty-icon" aria-hidden>🔐</span>
            <div><h2>This area is locked</h2><p>Your member account is safe; only the operations desk needs extra access.</p></div>
          </div>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="desk-stage">
        <PageHero
          kicker={desk.admin ? "Admin" : "Staff"}
          title="House desk"
          sub={
            desk.admin
              ? "Tickets, analytics, audit, plans, member edit, and staff appoint."
              : "Work tickets, confirm plans, review the audit log, and edit member profiles."
          }
        />
        <div className="browse-board desk-board">
          <DeskNav admin={desk.admin} />
          <div className="desk-main">
            <Suspense fallback={<DeskPaneFallback />}>{children}</Suspense>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
