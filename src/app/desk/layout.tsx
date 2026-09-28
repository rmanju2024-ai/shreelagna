import { Suspense } from "react";
import { PageShell } from "@/components/site-chrome";
import { DeskNav } from "@/app/desk/desk-nav";
import { DeskPaneFallback } from "@/app/desk/desk-fallback";
import { requireDesk } from "@/lib/desk/access";

export default async function DeskLayout({ children }: { children: React.ReactNode }) {
  const desk = await requireDesk();
  if (!desk.allowed) {
    return (
      <PageShell>
        <h1 className="font-[family-name:var(--font-display)] text-4xl">Staff only</h1>
        <p className="mt-3 max-w-xl text-[var(--muted)]">
          This desk is for family operators. Ask an admin to grant the service role on your Gmail.
        </p>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="desk-stage">
        <header className="desk-hero">
          <p className="browse-kicker">{desk.admin ? "Admin" : "Staff"}</p>
          <h1>House desk</h1>
          <p>
            {desk.admin
              ? "Tickets, analytics, audit, plans, member edit, and staff appoint."
              : "Work tickets, confirm plans, review the audit log, and edit member profiles. Admin profiles stay hidden."}
          </p>
        </header>
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
