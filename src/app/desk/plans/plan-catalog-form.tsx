"use client";

import { useActionState, useEffect, useState, type ReactNode } from "react";
import { btnGhost, btnPrimary, cardClass } from "@/lib/ui/classes";
import type { PlanWriteState } from "@/app/desk/plans/actions";

export function PlanCatalogForm({
  action,
  submitLabel,
  busyLabel,
  savedLabel,
  ghost = false,
  children,
}: {
  action: (prev: PlanWriteState | null, formData: FormData) => Promise<PlanWriteState>;
  submitLabel: string;
  busyLabel: string;
  savedLabel: string;
  ghost?: boolean;
  children: ReactNode;
}) {
  const [state, formAction, pending] = useActionState(action, null);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (state?.ok) setDirty(false);
  }, [state]);

  const saved = Boolean(state?.ok) && !pending && !dirty;
  const failed = state && !state.ok && !pending;

  return (
    <form
      action={formAction}
      className={`${cardClass} plan-edit-form${pending ? " is-saving" : ""}${saved ? " is-saved" : ""}${failed ? " is-failed" : ""}`}
      onInput={() => setDirty(true)}
      aria-busy={pending}
    >
      {children}
      <p className="plan-save-status" role="status" aria-live="polite">
        {pending ? busyLabel : saved ? savedLabel : failed ? state.error : "\u00a0"}
      </p>
      <button type="submit" className={`${ghost ? btnGhost : btnPrimary} plan-save-btn`} disabled={pending}>
        {pending ? busyLabel : saved ? "Saved" : submitLabel}
      </button>
    </form>
  );
}
