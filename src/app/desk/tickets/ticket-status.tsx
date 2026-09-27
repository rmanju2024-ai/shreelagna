import { TICKET_STATUSES, type TicketNote, ticketStatusLabel } from "@/lib/desk/tickets";
import { formatIstDateTime } from "@/lib/time/ist";
import { btnGhost, btnPrimary, inputClass } from "@/lib/ui/classes";
import { addTicketNote, setTicketStatus } from "./actions";

export function TicketStatusForm({ id, status }: { id: string; status: string }) {
  return (
    <form action={setTicketStatus} className="desk-ticket-status">
      <input type="hidden" name="id" value={id} />
      <select name="status" defaultValue={status} className={inputClass} aria-label="Ticket status">
        {TICKET_STATUSES.map((item) => (
          <option key={item} value={item}>
            {ticketStatusLabel(item)}
          </option>
        ))}
      </select>
      <button type="submit" className={btnPrimary}>
        Save status
      </button>
    </form>
  );
}

export function TicketNotes({
  id,
  notes,
  fallback,
}: {
  id: string;
  notes: TicketNote[];
  fallback?: string | null;
}) {
  const trail = notes.length
    ? notes
    : fallback?.trim()
      ? [{ id: "legacy", ticket_id: id, body: fallback.trim(), created_at: "" }]
      : [];

  return (
    <div className="desk-ticket-work">
      {trail.length ? (
        <ol className="desk-ticket-notes">
          {trail.map((note) => (
            <li key={note.id}>
              {note.created_at ? (
                <time dateTime={note.created_at}>{formatIstDateTime(note.created_at)}</time>
              ) : (
                <time>Earlier note</time>
              )}
              <p>{note.body}</p>
            </li>
          ))}
        </ol>
      ) : (
        <p className="desk-empty">No follow-ups yet. Add the first house note below.</p>
      )}
      <form action={addTicketNote} className="desk-ticket-note-form">
        <input type="hidden" name="id" value={id} />
        <label className="desk-ticket-note-label">
          New note
          <textarea
            name="body"
            className={inputClass}
            rows={4}
            maxLength={2000}
            placeholder="Call made, waiting on family, next step…"
          />
        </label>
        <button type="submit" className={btnGhost}>
          Add note
        </button>
      </form>
    </div>
  );
}
