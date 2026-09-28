"use client";

import { useEffect, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { TicketNotes, TicketStatusForm } from "@/app/desk/tickets/ticket-status";
import {
  ticketEnquiryLabel,
  ticketStatusClass,
  ticketStatusLabel,
  type TicketNote,
} from "@/lib/desk/tickets";
import type { DeskTicketRow } from "@/lib/desk/ticket-rows";
import { formatIstDateTime } from "@/lib/time/ist";
import { btnGhost, btnPrimary, cardClass, inputClass } from "@/lib/ui/classes";
import { saveTicketDetails } from "./actions";

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
    if (!ticket) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [ticket, path]);

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
      {ticket ? (
        <div className="desk-ticket-layer" role="presentation" onClick={close}>
          <div
            className="desk-ticket-modal card-3d"
            role="dialog"
            aria-modal="true"
            aria-labelledby="desk-ticket-title"
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
              <form
                key={`${ticket.id}-${ticket.name}-${ticket.message}-${ticket.email}-${ticket.mobile}-${ticket.city}`}
                action={saveTicketDetails}
                className={`${cardClass} card-3d desk-case`}
              >
                <input type="hidden" name="id" value={String(ticket.id)} />
                <p className="browse-kicker">Family message</p>
                <div className="gold-ornament" />
                <div className="desk-ticket-fields">
                  <label className="desk-ticket-note-label">
                    Name
                    <input name="name" required className={inputClass} defaultValue={String(ticket.name ?? "")} />
                  </label>
                  <label className="desk-ticket-note-label">
                    City
                    <input name="city" className={inputClass} defaultValue={String(ticket.city ?? "")} />
                  </label>
                  <label className="desk-ticket-note-label">
                    Email
                    <input name="email" type="email" className={inputClass} defaultValue={String(ticket.email ?? "")} />
                  </label>
                  <label className="desk-ticket-note-label">
                    Mobile
                    <input name="mobile" className={inputClass} defaultValue={String(ticket.mobile ?? "")} />
                  </label>
                  <label className="desk-ticket-note-label desk-ticket-field-wide">
                    Message
                    <textarea
                      name="message"
                      rows={8}
                      className={inputClass}
                      defaultValue={String(ticket.message ?? "")}
                    />
                  </label>
                </div>
                <button type="submit" className={btnPrimary}>
                  Save details
                </button>
              </form>

              <aside className="desk-ticket-side">
                <div className={`${cardClass} card-3d desk-case`}>
                  <p className="browse-kicker">House status</p>
                  <div className="gold-ornament" />
                  <TicketStatusForm
                    key={`${ticket.id}-${ticket.status}`}
                    id={String(ticket.id)}
                    status={String(ticket.status ?? "new")}
                  />
                </div>
                <div className={`${cardClass} card-3d desk-case`}>
                  <p className="browse-kicker">Follow-up</p>
                  <div className="gold-ornament" />
                  <TicketNotes
                    id={String(ticket.id)}
                    notes={trail}
                    fallback={"resolution" in ticket ? String(ticket.resolution ?? "") : null}
                  />
                </div>
              </aside>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
