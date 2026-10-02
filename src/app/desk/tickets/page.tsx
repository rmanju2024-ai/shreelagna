import { Suspense } from "react";
import { DeskPager } from "@/app/desk/desk-pager";
import { TicketBoard } from "@/app/desk/tickets/ticket-board";
import { requireDesk } from "@/lib/desk/access";
import { cachedDeskTickets } from "@/lib/desk/cached";
import { deskPage, deskRange } from "@/lib/desk/pager";
import { fetchDeskTicket, fetchDeskTickets, fetchTicketNotes } from "@/lib/desk/ticket-rows";
import { isOpenTicket } from "@/lib/desk/tickets";

export default async function DeskTicketsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; open?: string }>;
}) {
  const desk = await requireDesk("/desk/tickets");
  if (!desk.allowed) return null;
  const { page: rawPage, open: openId } = await searchParams;
  const page = deskPage(rawPage);
  const { from, to } = deskRange(page);
  const { rows, count } = await cachedDeskTickets(from, to).catch(() =>
    fetchDeskTickets(desk.supabase, from, to),
  );
  const extra =
    openId && !rows.some((row) => String(row.id) === openId)
      ? await fetchDeskTicket(desk.supabase, openId)
      : null;
  const notes = await fetchTicketNotes(
    desk.supabase,
    [...rows.map((row) => String(row.id)), extra ? String(extra.id) : ""].filter(Boolean),
  );
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
      {rows.length ? (
        <Suspense fallback={<p className="desk-empty">Opening tickets…</p>}>
          <TicketBoard tickets={rows} extra={extra as (typeof rows)[number] | null} notes={notes}>
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
