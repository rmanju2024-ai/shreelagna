"use client";

import { useActionState } from "react";
import { submitContact } from "./actions";
import { Select3d } from "@/components/select3d";
import { btnPrimary, inputClass } from "@/lib/ui/classes";

export function ContactForm() {
  const [state, action, pending] = useActionState(submitContact, null);

  return (
    <form action={action} className="help-genz-form">
      <label className="block">
        <span>Your name <i>Required</i></span>
        <input
          name="name"
          required
          minLength={2}
          className={inputClass}
        />
      </label>
      <label className="block">
        <span>Gmail <i>Optional</i></span>
        <input
          name="email"
          type="email"
          className={inputClass}
        />
      </label>
      <label className="block">
        <span>Mobile <i>Optional</i></span>
        <input
          name="mobile"
          inputMode="numeric"
          className={inputClass}
        />
      </label>
      <label className="block">
        <span>City <i>Optional</i></span>
        <input
          name="city"
          className={inputClass}
        />
      </label>
      <label className="block">
        <span>What do you need?</span>
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
        <span>Tell us more <i>Required</i></span>
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
      <p className="help-genz-privacy">
        🔒 We use these details only to reply about Shree Lagna.
      </p>
      {state?.ok ? (
        <p className="help-genz-success">✨ Sent! Someone from the team will read this.</p>
      ) : null}
      {state?.error ? <p className="help-genz-error">{state.error}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className={btnPrimary}
      >
        {pending ? "Sending…" : "Send message ✦"}
      </button>
    </form>
  );
}
