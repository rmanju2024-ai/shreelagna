"use client";

import { useState } from "react";
import {
  ABOUT_MAX,
  ABOUT_MIN,
  FAMILY_NOTE_MAX,
  aboutPlainText,
} from "@/lib/profile/about-html";

export function AboutEditor({
  name,
  defaultValue = "",
  min = ABOUT_MIN,
  max = ABOUT_MAX,
  required,
  locked,
  placeholder,
}: {
  name: string;
  defaultValue?: string;
  min?: number;
  max?: number;
  required?: boolean;
  locked?: boolean;
  placeholder?: string;
}) {
  const initial = aboutPlainText(defaultValue).slice(0, max);
  const [text, setText] = useState(initial);
  const count = text.length;
  const short = count > 0 && min > 0 && count < min;
  const full = count >= max;

  function clip(raw: string) {
    setText(raw.slice(0, max));
  }

  return (
    <div className={`about-editor${locked ? " is-locked" : ""}`}>
      <textarea
        name={name}
        required={required}
        disabled={locked}
        minLength={min > 0 ? min : undefined}
        maxLength={max}
        rows={7}
        placeholder={placeholder}
        value={text}
        className="input-premium about-surface"
        onChange={(e) => clip(e.currentTarget.value)}
        onPaste={(e) => {
          e.preventDefault();
          const pasted = e.clipboardData.getData("text") ?? "";
          const el = e.currentTarget;
          const start = el.selectionStart ?? text.length;
          const end = el.selectionEnd ?? text.length;
          clip(text.slice(0, start) + pasted + text.slice(end));
        }}
      />
      <p className={`about-count${short ? " is-short" : ""}${full ? " is-full" : ""}`}>
        {count} / {max} characters{min > 0 ? ` · at least ${min}` : ""}
      </p>
    </div>
  );
}

export function CountedArea({
  name,
  defaultValue = "",
  max = FAMILY_NOTE_MAX,
  rows = 3,
  placeholder,
}: {
  name: string;
  defaultValue?: string;
  max?: number;
  rows?: number;
  placeholder?: string;
}) {
  const initial = aboutPlainText(defaultValue);
  const [count, setCount] = useState(initial.length);
  return (
    <>
      <textarea
        name={name}
        maxLength={max}
        rows={rows}
        placeholder={placeholder}
        defaultValue={initial}
        className="input-premium"
        onInput={(e) => setCount(e.currentTarget.value.length)}
      />
      <p className={`about-count${count >= max ? " is-full" : ""}`}>
        {count} / {max} characters
      </p>
    </>
  );
}
