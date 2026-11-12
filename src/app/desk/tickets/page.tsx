import { Suspense } from "react";
import { DeskPager } from "@/app/desk/desk-pager";
import { QueueViewLinks } from "@/app/desk/queue-tools";
import { TicketBoard } from "@/app/desk/tickets/ticket-board";
import { requireDesk } from "@/lib/desk/access";
import { cachedDeskTickets, cachedStaffRoster } from "@/lib/desk/cached";
import { deskPage, deskRange } from "@/lib/desk/pager";
import { fitsQueue, parseQueueView } from "@/lib/desk/sla";
import { staffOptionLabel } from "@/lib/desk/staff-options";
import { fetchDeskTicket, fetchDeskTickets, fetchTicketNotes } from "@/lib/desk/ticket-rows";
import { isOpenTicket } from "@/lib/desk/tickets";

export default async function DeskTicketsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; open?: string; view?: string }>;
}) {
  const desk = await requireDesk("/desk/tickets");
  if (!desk.allowed) return null;
  const { page: rawPage, open: openId, view: rawView } = await searchParams;
  const view = parseQueueView(rawView);
  const page = deskPage(rawPage);
  const { from, to } = deskRange(page);
  const staffId = desk.me?.id ?? "";
  const loaded = await cachedDeskTickets(from, to).catch(() => fetchDeskTickets(desk.supabase, from, to));
  const roster = await cachedStaffRoster().catch(() => [] as { id: string; email?: string | null; display_name?: string | null }[]);
  const names = new Map(roster.map((row) => [row.id, staffOptionLabel(row)]));
  const rows = loaded.rows
    .filter((row) =>
      fitsQueue(
        { assignedTo: row.assigned_to, createdAt: row.created_at, dueAt: row.due_at, status: row.status },
        view,
        staffId,
      ),
    )
    .map((row) => ({ ...row, assigned_name: row.assigned_to ? names.get(row.assigned_to) ?? null : null }));
  const count = view === "all" ? loaded.count : rows.length;
  const extraP =
    openId && !rows.some((row) => String(row.id) === openId)
      ? fetchDeskTicket(desk.supabase, openId)
      : Promise.resolve(null);
  const notesP = fetchTicketNotes(
    desk.supabase,
    [...rows.map((row) => String(row.id)), openId ?? ""].filter(Boolean),
  );
  const [extra, notes] = await Promise.all([extraP, notesP]);
  const open = rows.filter((row) => isOpenTicket(String(row.status ?? ""))).length;

  return (
    <section className="desk-panel">
      <header className="desk-panel-head">
        <div>
          <h2>Contact from families</h2>
        </div>
        <p>
          {open} open on this page · {count} total
        </p>
      </header>
      <QueueViewLinks path="/desk/tickets" view={view} />
      {rows.length ? (
        <Suspense fallback={<p className="desk-empty">Opening tickets…</p>}>
          <TicketBoard
            tickets={rows}
            extra={extra as (typeof rows)[number] | null}
            notes={notes}
            staff={roster.map((row) => ({ id: row.id, label: staffOptionLabel(row) }))}
          >
            <DeskPager path="/desk/tickets" page={page} count={count} />
          </TicketBoard>
        </Suspense>
      ) : (
        <>
          <p className="desk-empty">No contact tickets yet.</p>
          <DeskPager path="/desk/tickets" page={page} count={count} />
        </>
      )}
    </section>
  );
}
