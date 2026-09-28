import { houseRoleLabel } from "@/lib/desk/breakdown";
import { ticketStatusClass, ticketStatusLabel, type TicketNote } from "@/lib/desk/tickets";
import { formatIstDateTime } from "@/lib/time/ist";

export function TicketNoteTrail({
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
      ? [{ id: "legacy", ticket_id: id, body: fallback.trim(), created_at: "", actor_name: "House note" }]
      : [];

  if (!trail.length) {
    return <p className="desk-empty">No staff notes yet.</p>;
  }

  return (
    <ol className="desk-ticket-notes">
      {trail.map((note) => (
        <li key={note.id}>
          <p className="desk-ticket-note-by">
            <strong>{note.actor_name || "Staff"}</strong>
            {note.actor_role ? <span>{houseRoleLabel(note.actor_role)}</span> : null}
            {note.ticket_status ? (
              <span className={`desk-pill ${ticketStatusClass(note.ticket_status)}`}>
                {ticketStatusLabel(note.ticket_status)}
              </span>
            ) : null}
          </p>
          {note.created_at ? (
            <time dateTime={note.created_at}>{formatIstDateTime(note.created_at)}</time>
          ) : (
            <time>Earlier note</time>
          )}
          <p>{note.body}</p>
        </li>
      ))}
    </ol>
  );
}
