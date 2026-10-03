"use client";

import { useActionState, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { deleteOwnProfile } from "@/app/app/profiles/actions";
import { deleteDeskProfile } from "@/app/desk/profiles/actions";
import { DELETE_PROFILE_WORD, hasDeleteConfirmation } from "@/lib/profile/delete-confirmation";
import { btnGhost } from "@/lib/ui/classes";

type DeleteResult = { ok: true } | { ok: false; error: string };
const initial: DeleteResult = { ok: false, error: "" };

export function ProfileDeleteControl({
  profileId,
  staff = false,
  compact = false,
}: {
  profileId: string;
  staff?: boolean;
  compact?: boolean;
}) {
  const router = useRouter();
  const action = staff ? deleteDeskProfile : deleteOwnProfile;
  const [state, formAction, pending] = useActionState(action, initial);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [confirmation, setConfirmation] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!state.ok) return;
    router.replace(staff ? "/desk/profiles" : "/app?deleted=1");
    router.refresh();
  }, [router, staff, state.ok]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !pending) setOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, pending]);

  function close() {
    if (!pending) {
      setOpen(false);
      setConfirmation("");
    }
  }

  const dialog = open ? (
    <div className="profile-delete-layer" role="presentation" onMouseDown={close}>
      <div
        className="profile-delete-dialog card-3d"
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-profile-title"
        aria-describedby="delete-profile-description"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <span className="profile-delete-dialog-icon" aria-hidden>!</span>
        <p className="browse-kicker">Permanent action</p>
        <h2 id="delete-profile-title">Delete this profile?</h2>
        <p id="delete-profile-description">
          This permanently removes the profile, photos, introductions, chats, interests, and related records. It cannot be undone.
        </p>
        <form action={formAction} className="profile-delete-dialog-form">
          <input type="hidden" name="profile_id" value={profileId} />
          <label>
            Type <b>{DELETE_PROFILE_WORD}</b> to continue
            <input
              name="confirmation"
              value={confirmation}
              autoComplete="off"
              autoFocus
              onChange={(event) => setConfirmation(event.target.value)}
            />
          </label>
          {!state.ok && state.error ? <p className="profile-delete-error" role="alert">{state.error}</p> : null}
          <div className="profile-delete-dialog-actions">
            <button type="button" className={btnGhost} disabled={pending} onClick={close}>
              Keep profile
            </button>
            <button
              className={`${btnGhost} profile-delete-confirm`}
              type="submit"
              disabled={pending || !hasDeleteConfirmation(confirmation)}
            >
              {pending ? "Deleting…" : "Delete permanently"}
            </button>
          </div>
        </form>
      </div>
    </div>
  ) : null;

  return (
    <>
      <div className={`profile-delete-control${compact ? " is-compact" : ""}`}>
      {!compact ? <p>Remove this matrimonial profile permanently. This cannot be undone.</p> : null}
      <button
        className={btnGhost}
        type="button"
        onClick={() => setOpen(true)}
      >
        Delete profile
      </button>
      </div>
      {mounted && dialog ? createPortal(dialog, document.body) : dialog}
    </>
  );
}
