"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { TicketNoteTrail } from "@/app/desk/tickets/ticket-status";
import { TICKET_STATUSES, ticketEnquiryLabel, ticketStatusClass, ticketStatusLabel, type TicketNote } from "@/lib/desk/tickets";
import type { DeskTicketRow } from "@/lib/desk/ticket-rows";
import { formatIstDateTime } from "@/lib/time/ist";
import { btnGhost, btnPrimary, cardClass, inputClass } from "@/lib/ui/classes";
import { saveTicketWork } from "./actions";

function TicketWorkForm({ ticket, notes }: { ticket: DeskTicketRow; notes: TicketNote[] }) {
  const [status, setStatus] = useState(String(ticket.status ?? "new"));

  return (
    <form action={saveTicketWork} className={`${cardClass} card-3d desk-case desk-ticket-work-form`}>
      <input type="hidden" name="id" value={String(ticket.id)} />
      <label className="desk-ticket-note-label">
        Status
        <select
          name="status"
          value={status}
          className={inputClass}
          aria-label="Ticket status"
          onChange={(event) => setStatus(event.target.value)}
        >
          {TICKET_STATUSES.map((item) => (
            <option key={item} value={item}>
              {ticketStatusLabel(item)}
            </option>
          ))}
        </select>
      </label>
      <TicketNoteTrail
        id={String(ticket.id)}
        notes={notes}
        fallback={"resolution" in ticket ? String(ticket.resolution ?? "") : null}
      />
      <label className="desk-ticket-note-label">
        <span className="desk-ticket-new-note-label">
          New note
          <span className={`desk-pill ${ticketStatusClass(status)}`}>{ticketStatusLabel(status)}</span>
        </span>
        <textarea
          name="body"
          className={inputClass}
          rows={4}
          maxLength={2000}
          placeholder={`Note while ticket is ${ticketStatusLabel(status).toLowerCase()}…`}
        />
      </label>
      <button type="submit" className={btnPrimary}>
        Save
      </button>
    </form>
  );
}

export function TicketBoard({
  tickets,
  extra,
  notes,
  children,
}: {
  tickets: DeskTicketRow[];
  extra?: DeskTicketRow | null;
  notes: TicketNote[];
  children: React.ReactNode;
}) {
  const router = useRouter();
  const path = usePathname();
  const params = useSearchParams();
  const [mounted, setMounted] = useState(false);
  const openId = params.get("open");
  const ticket = useMemo(
    () =>
      tickets.find((row) => String(row.id) === openId) ??
      (extra && String(extra.id) === openId ? extra : null),
    [tickets, extra, openId],
  );
  const trail = useMemo(
    () => notes.filter((note) => note.ticket_id === openId),
    [notes, openId],
  );

  function close() {
    const q = new URLSearchParams(params.toString());
    q.delete("open");
    const next = q.toString();
    router.replace(next ? `${path}?${next}` : path, { scroll: false });
  }

  function open(id: string) {
    const q = new URLSearchParams(params.toString());
    q.set("open", id);
    router.replace(`${path}?${q.toString()}`, { scroll: false });
  }

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!ticket) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        close();
      }
    };
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey, true);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey, true);
    };
  }, [ticket, path, params]);

  const dialog =
    ticket && mounted
      ? createPortal(
          <div
            className="desk-ticket-layer"
            role="presentation"
            onMouseDown={(event) => event.stopPropagation()}
            onClick={(event) => event.stopPropagation()}
          >
            <div
              className="desk-ticket-modal card-3d"
              role="dialog"
              aria-modal="true"
              aria-labelledby="desk-ticket-title"
              onMouseDown={(event) => event.stopPropagation()}
              onClick={(event) => event.stopPropagation()}
            >
              <header className="desk-ticket-modal-head">
                <div>
                  <p className="browse-kicker">{ticketEnquiryLabel(String(ticket.enquiry_type ?? ""))}</p>
                  <h2 id="desk-ticket-title">{String(ticket.name)}</h2>
                  <p className="desk-ticket-meta">
                    {formatIstDateTime(String(ticket.created_at))}
                    {ticket.city ? ` · ${ticket.city}` : ""}
                  </p>
                </div>
                <span className={`desk-pill ${ticketStatusClass(String(ticket.status ?? ""))}`}>
                  {ticketStatusLabel(String(ticket.status ?? ""))}
                </span>
                <button type="button" className={`${btnGhost} desk-ticket-modal-close`} onClick={close}>
                  Close
                </button>
              </header>

              <div className="desk-ticket-modal-grid">
                <article className={`${cardClass} card-3d desk-case`}>
                  <dl className="desk-ticket-facts">
                    <div>
                      <dt>Name</dt>
                      <dd>{String(ticket.name || "—")}</dd>
                    </div>
                    <div>
                      <dt>City</dt>
                      <dd>{String(ticket.city || "—")}</dd>
                    </div>
                    <div>
                      <dt>Email</dt>
                      <dd>
                        {ticket.email ? (
                          <a href={`mailto:${ticket.email}`}>{ticket.email}</a>
                        ) : (
                          "—"
                        )}
                      </dd>
                    </div>
                    <div>
                      <dt>Mobile</dt>
                      <dd>
                        {ticket.mobile ? (
                          <a href={`tel:${String(ticket.mobile).replace(/\s+/g, "")}`}>{ticket.mobile}</a>
                        ) : (
                          "—"
                        )}
                      </dd>
                    </div>
                    <div className="desk-ticket-field-wide">
                      <dt>Message</dt>
                      <dd className="desk-case-body">{String(ticket.message || "No message")}</dd>
                    </div>
                  </dl>
                </article>

                <TicketWorkForm
                  key={`${ticket.id}-${ticket.status}-${trail.length}`}
                  ticket={ticket}
                  notes={trail}
                />
              </div>
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <ul className="desk-ticket-list">
        {tickets.map((row) => (
          <li key={String(row.id)}>
            <button
              type="button"
              className={`${cardClass} card-3d desk-ticket-row`}
              onClick={() => open(String(row.id))}
            >
              <span className="desk-ticket-row-main">
                <span className="desk-ticket-name">{String(row.name)}</span>
                <span className={`desk-pill ${ticketStatusClass(String(row.status ?? ""))}`}>
                  {ticketStatusLabel(String(row.status ?? ""))}
                </span>
                <span className="desk-ticket-meta">
                  {ticketEnquiryLabel(String(row.enquiry_type ?? ""))}
                  {" · "}
                  {formatIstDateTime(String(row.created_at))}
                  {row.city ? ` · ${row.city}` : ""}
                </span>
              </span>
              <span className="desk-ticket-open">View</span>
            </button>
          </li>
        ))}
      </ul>
      {children}
      {dialog}
    </>
  );
}
