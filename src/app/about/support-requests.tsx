"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { FieldMark } from "@/app/app/profiles/field-mark";
import {
  memberRequestStatus,
  requestOutcomeLines,
  ticketEnquiryLabel,
  ticketStatusClass,
  type MemberSupportRequest,
} from "@/lib/desk/tickets";

function when(iso: string) {
  const at = new Date(iso);
  if (Number.isNaN(at.getTime())) return "";
  return at.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function RequestDialog({
  open,
  onClose,
}: {
  open: MemberSupportRequest | null;
  onClose: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  const tone = open ? memberRequestStatus(open.status) : null;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!mounted || !open || !tone) return null;
  return createPortal(
    <div className="help-request-layer" role="presentation" onClick={onClose}>
      <div
        className="help-request-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="help-request-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="help-request-modal-head">
          <div>
            <p className="browse-kicker">Support request</p>
            <h3 id="help-request-title">{ticketEnquiryLabel(open.enquiry_type)}</h3>
            {when(open.created_at) ? <p>{when(open.created_at)}</p> : null}
          </div>
          <span className={`desk-pill ${ticketStatusClass(open.status)}`}>{tone.label}</span>
        </header>
        <div className="help-request-modal-body">
          <p className="help-request-label">Your note</p>
          <p className="help-request-note">{open.message}</p>
          <p className="help-request-hint">{tone.hint}</p>
          {open.status === "done" ? (
            <div className="help-request-outcome">
              <p className="help-request-label">Outcome</p>
              {requestOutcomeLines(open.resolution).length ? (
                <ol>
                  {requestOutcomeLines(open.resolution).map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ol>
              ) : (
                <p>This request is closed.</p>
              )}
            </div>
          ) : null}
        </div>
        <button type="button" className="help-request-close" onClick={onClose}>
          Close
        </button>
      </div>
    </div>,
    document.body,
  );
}

export function SupportRequests({
  requests,
  compact = false,
}: {
  requests: MemberSupportRequest[];
  compact?: boolean;
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  const open = requests.find((row) => row.id === openId) ?? null;
  const rows = requests.map((row) => {
    const status = memberRequestStatus(row.status);
    return (
      <li key={row.id}>
        <button type="button" className="account-hub-row" onClick={() => setOpenId(row.id)}>
          <em className="account-hub-ico" aria-hidden>
            <FieldMark label="Contact" />
          </em>
          <span className="account-hub-row-copy">
            <strong>{ticketEnquiryLabel(row.enquiry_type)}</strong>
            <small>{status.label}</small>
          </span>
          <span className="account-hub-go" aria-hidden>
            →
          </span>
        </button>
      </li>
    );
  });
  const dialog = <RequestDialog open={open} onClose={() => setOpenId(null)} />;

  if (compact) {
    return (
      <>
        {rows}
        {dialog}
      </>
    );
  }

  return (
    <section className="help-requests" aria-label="Your requests">
      <h2>Your requests</h2>
      {requests.length ? <ul className="account-hub-list">{rows}</ul> : <p>When you write to the house, each request will list here with its status.</p>}
      {dialog}
    </section>
  );
}
