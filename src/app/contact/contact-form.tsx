"use client";

import { useActionState } from "react";
import { submitContact } from "./actions";
import { Select3d } from "@/components/select3d";
import { btnPrimary, inputClass } from "@/lib/ui/classes";

export function ContactForm() {
  const [state, action, pending] = useActionState(submitContact, null);

  return (
    <form action={action} className="w-full space-y-4">
      <label className="block">
        <span className="text-sm text-[var(--muted)]">Your name</span>
        <input
          name="name"
          required
          minLength={2}
          className={inputClass}
        />
      </label>
      <label className="block">
        <span className="text-sm text-[var(--muted)]">Gmail</span>
        <input
          name="email"
          type="email"
          className={inputClass}
        />
      </label>
      <label className="block">
        <span className="text-sm text-[var(--muted)]">Mobile</span>
        <input
          name="mobile"
          inputMode="numeric"
          className={inputClass}
        />
      </label>
      <label className="block">
        <span className="text-sm text-[var(--muted)]">City</span>
        <input
          name="city"
          className={inputClass}
        />
      </label>
      <label className="block">
        <span className="text-sm text-[var(--muted)]">Enquiry</span>
        <Select3d
          name="enquiry_type"
          className={inputClass}
          defaultValue="general"
        >
          <option value="general">General help</option>
          <option value="vadhu">Posting a bride profile</option>
          <option value="vara">Posting a groom profile</option>
        </Select3d>
      </label>
      <label className="block">
        <span className="text-sm text-[var(--muted)]">Message</span>
        <textarea
          name="message"
          required
          minLength={10}
          rows={5}
          className={inputClass}
        />
      </label>
      <div className="hidden" aria-hidden>
        <input name="company" tabIndex={-1} autoComplete="off" />
      </div>
      <p className="text-xs text-[var(--muted)]">
        We will use this only to reply about Shree Lagna.
      </p>
      {state?.ok ? (
        <p className="text-sm text-[var(--accent)]">Thank you. Someone will read this.</p>
      ) : null}
      {state?.error ? <p className="text-sm text-red-800">{state.error}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className={btnPrimary}
      >
        {pending ? "Sending…" : "Send"}
      </button>
    </form>
  );
}
