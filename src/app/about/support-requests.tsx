"use client";

import { useState } from "react";
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

export function SupportRequests({
  requests,
  compact = false,
}: {
  requests: MemberSupportRequest[];
  compact?: boolean;
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  if (!requests.length) {
    if (compact) return null;
    return (
      <section className="help-requests" aria-label="Your requests">
        <p className="browse-kicker">Your requests</p>
        <h2>No requests yet</h2>
        <p>When you write to the house, the heading and status will appear here.</p>
      </section>
    );
  }

  return (
    <section className={`help-requests${compact ? " is-compact" : ""}`} aria-label="Your requests">
      {compact ? <p className="browse-kicker">Your requests</p> : <h2>Your requests</h2>}
      <ul>
        {requests.map((row) => {
          const tone = memberRequestStatus(row.status);
          const open = openId === row.id;
          return (
            <li key={row.id}>
              <button
                type="button"
                className={`help-request-row${open ? " is-open" : ""}`}
                aria-expanded={open}
                onClick={() => setOpenId(open ? null : row.id)}
              >
                <span className="help-request-title">{ticketEnquiryLabel(row.enquiry_type)}</span>
                <span className={`desk-pill ${ticketStatusClass(row.status)}`}>{tone.label}</span>
              </button>
              {open ? (
                <div className="help-request-detail">
                  {when(row.created_at) ? <p className="help-request-date">{when(row.created_at)}</p> : null}
                  <p>{row.message}</p>
                  <p className="help-request-hint">{tone.hint}</p>
                  {row.status === "done" && row.resolution ? (
                    <p className="help-request-outcome">
                      <strong>Outcome</strong>
                      {row.resolution}
                    </p>
                  ) : null}
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
