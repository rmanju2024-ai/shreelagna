import Link from "next/link";
import { DeskPager } from "@/app/desk/desk-pager";
import { requireDesk } from "@/lib/desk/access";
import { deskPage, deskRange } from "@/lib/desk/pager";
import { fetchDeskTickets } from "@/lib/desk/ticket-rows";
import { cachedDeskTickets } from "@/lib/desk/cached";
import { isOpenTicket, ticketEnquiryLabel, ticketStatusClass, ticketStatusLabel } from "@/lib/desk/tickets";
import { formatIstDateTime } from "@/lib/time/ist";
import { cardClass } from "@/lib/ui/classes";

export default async function DeskTicketsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const desk = await requireDesk("/desk/tickets");
  if (!desk.allowed) return null;
  const { page: rawPage } = await searchParams;
  const page = deskPage(rawPage);
  const { from, to } = deskRange(page);
  const { rows, count } = await cachedDeskTickets(from, to).catch(() =>
    fetchDeskTickets(desk.supabase, from, to),
  );
  const open = rows.filter((row) => isOpenTicket(String(row.status ?? ""))).length;

  return (
    <section className="desk-panel">
      <header className="desk-panel-head">
        <div>
          <p className="browse-kicker">Ticketing</p>
          <h2>Contact from families</h2>
        </div>
        <p>
          {open} open on this page · {count} total
        </p>
      </header>
      {rows.length ? (
        <ul className="desk-ticket-list">
          {rows.map((ticket) => (
            <li key={String(ticket.id)}>
              <Link href={`/desk/tickets/${ticket.id}`} className={`${cardClass} card-3d desk-ticket-row`}>
                <span className="desk-ticket-row-main">
                  <span className="desk-ticket-name">{String(ticket.name)}</span>
                  <span className={`desk-pill ${ticketStatusClass(String(ticket.status ?? ""))}`}>
                    {ticketStatusLabel(String(ticket.status ?? ""))}
                  </span>
                  <span className="desk-ticket-meta">
                    {ticketEnquiryLabel(String(ticket.enquiry_type ?? ""))}
                    {" · "}
                    {formatIstDateTime(String(ticket.created_at))}
                    {ticket.city ? ` · ${ticket.city}` : ""}
                  </span>
                </span>
                <span className="desk-ticket-open">View</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="desk-empty">No contact tickets yet.</p>
      )}
      <DeskPager path="/desk/tickets" page={page} count={count} />
    </section>
  );
}
