import Link from "next/link";
import { notFound } from "next/navigation";
import { TicketNotes, TicketStatusForm } from "@/app/desk/tickets/ticket-status";
import { requireDesk } from "@/lib/desk/access";
import { fetchDeskTicket, fetchTicketNotes } from "@/lib/desk/ticket-rows";
import { ticketEnquiryLabel, ticketStatusClass, ticketStatusLabel } from "@/lib/desk/tickets";
import { formatIstDateTime } from "@/lib/time/ist";
import { cardClass } from "@/lib/ui/classes";

export const dynamic = "force-dynamic";

export default async function DeskTicketPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const desk = await requireDesk(`/desk/tickets/${id}`);
  if (!desk.allowed) return null;

  const ticket = await fetchDeskTicket(desk.supabase, id);
  if (!ticket) notFound();
  const notes = await fetchTicketNotes(desk.supabase, [id]);
  const status = String(ticket.status ?? "new");
  const email = typeof ticket.email === "string" ? ticket.email : "";
  const mobile = typeof ticket.mobile === "string" ? ticket.mobile : "";
  const city = typeof ticket.city === "string" ? ticket.city : "";

  return (
    <section className="desk-panel">
      <header className="desk-case-head">
        <Link href="/desk/tickets" className="desk-back">
          ← All tickets
        </Link>
        <p className="browse-kicker">{ticketEnquiryLabel(String(ticket.enquiry_type ?? ""))}</p>
        <div className="desk-case-title">
          <h2>{String(ticket.name)}</h2>
          <span className={`desk-pill ${ticketStatusClass(status)}`}>{ticketStatusLabel(status)}</span>
        </div>
        <p className="desk-ticket-meta">
          {formatIstDateTime(String(ticket.created_at))}
          {city ? ` · ${city}` : ""}
        </p>
      </header>

      <div className="desk-ticket-grid">
        <article className={`${cardClass} card-3d desk-case`}>
          <p className="browse-kicker">Family message</p>
          <div className="gold-ornament" />
          <p className="desk-case-body">{String(ticket.message ?? "")}</p>
          <ul className="desk-case-contacts">
            {email ? (
              <li>
                <a href={`mailto:${email}`}>{email}</a>
              </li>
            ) : null}
            {mobile ? (
              <li>
                <a href={`tel:${mobile.replace(/\s+/g, "")}`}>{mobile}</a>
              </li>
            ) : null}
            {city ? <li>{city}</li> : null}
          </ul>
        </article>

        <aside className="desk-ticket-side">
          <div className={`${cardClass} card-3d desk-case`}>
            <p className="browse-kicker">House status</p>
            <div className="gold-ornament" />
            <TicketStatusForm id={id} status={status} />
          </div>
          <div className={`${cardClass} card-3d desk-case`}>
            <p className="browse-kicker">Follow-up</p>
            <div className="gold-ornament" />
            <TicketNotes
              id={id}
              notes={notes}
              fallback={"resolution" in ticket ? String(ticket.resolution ?? "") : null}
            />
          </div>
        </aside>
      </div>
    </section>
  );
}
