"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { deleteOwnProfile } from "@/app/app/profiles/actions";
import { deleteDeskProfile } from "@/app/desk/profiles/actions";
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

  useEffect(() => {
    if (!state.ok) return;
    router.replace(staff ? "/desk/profiles" : "/app?deleted=1");
    router.refresh();
  }, [router, staff, state.ok]);

  return (
    <form className={`profile-delete-control${compact ? " is-compact" : ""}`} action={formAction}>
      <input type="hidden" name="profile_id" value={profileId} />
      {!compact ? (
        <>
          <p>
            This permanently removes the profile, its photos, introductions, chats, interests, and related records. This cannot be undone.
          </p>
          <label>
            Type <b>DELETE</b> to confirm
            <input name="confirmation" autoComplete="off" required />
          </label>
        </>
      ) : (
        <input name="confirmation" value="DELETE" readOnly className="sr-only" aria-hidden />
      )}
      {!state.ok && state.error ? <p className="profile-delete-error" role="alert">{state.error}</p> : null}
      <button
        className={btnGhost}
        type="submit"
        disabled={pending}
        onClick={(event) => {
          if (!window.confirm("Delete this profile permanently? This cannot be undone.")) event.preventDefault();
        }}
      >
        {pending ? "Deleting…" : "Delete profile"}
      </button>
    </form>
  );
}
