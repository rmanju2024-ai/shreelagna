import {
  memberRequestStatus,
  ticketEnquiryLabel,
  ticketStatusClass,
  type MemberSupportRequest,
} from "@/lib/desk/tickets";

function when(iso: string) {
  const at = new Date(iso);
  if (Number.isNaN(at.getTime())) return "";
  return at.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function preview(message: string) {
  const text = message.replace(/\s+/g, " ").trim();
  return text.length > 140 ? `${text.slice(0, 137)}…` : text;
}

export function SupportRequests({ requests }: { requests: MemberSupportRequest[] }) {
  if (!requests.length) {
    return (
      <section className="help-requests" aria-label="Your requests">
        <p className="browse-kicker">Your requests</p>
        <h2>Nothing with the house yet</h2>
        <p>When you write to us, the update will appear here — received, in review, or resolved.</p>
      </section>
    );
  }

  return (
    <section className="help-requests" aria-label="Your requests">
      <p className="browse-kicker">Your requests</p>
      <h2>How your notes are progressing</h2>
      <p>Staff notes stay with the desk. You see the status, and the outcome when a request is resolved.</p>
      <ul>
        {requests.map((row) => {
          const tone = memberRequestStatus(row.status);
          return (
            <li key={row.id} className="help-request-card">
              <header>
                <b>{ticketEnquiryLabel(row.enquiry_type)}</b>
                <span className={`desk-pill ${ticketStatusClass(row.status)}`}>{tone.label}</span>
              </header>
              <small>{when(row.created_at)}</small>
              <p>{preview(row.message)}</p>
              <p className="help-request-hint">{tone.hint}</p>
              {row.status === "done" && row.resolution ? (
                <p className="help-request-outcome">
                  <strong>Outcome</strong>
                  {row.resolution}
                </p>
              ) : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
