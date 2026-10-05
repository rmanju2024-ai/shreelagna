"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { FieldHelp } from "@/app/app/profiles/field-help";
import { FieldMark } from "@/app/app/profiles/field-mark";
import { compareLabel } from "@/lib/profile/form-lists";

type Option = { value: string; label: string };

function toOptions(options: Option[] | string[], alphabetize = true): Option[] {
  const seen = new Set<string>();
  const items = options
    .map((o) => (typeof o === "string" ? { value: o, label: o } : o))
    .filter((item) => {
      if (seen.has(item.value)) return false;
      seen.add(item.value);
      return true;
    });
  return alphabetize ? items.sort((a, b) => compareLabel(a.label, b.label)) : items;
}

export function HopePicker({
  label,
  name,
  options,
  selected = [],
  anyValue,
  anyLabel,
  className = "",
  alphabetize = true,
  help,
  disabled = false,
  disabledHint,
  onChange,
}: {
  label: string;
  name: string;
  options: Option[] | string[];
  selected?: string[] | null;
  anyValue?: string;
  anyLabel?: string;
  className?: string;
  alphabetize?: boolean;
  help?: string;
  disabled?: boolean;
  disabledHint?: string;
  onChange?: (values: string[]) => void;
}) {
  const anyText = anyLabel ?? anyValue ?? "Any";
  const items = useMemo(
    () => toOptions(options, alphabetize).filter((o) => !anyValue || o.value !== anyValue),
    [options, anyValue, alphabetize],
  );
  const start = selected?.length ? [...new Set(selected)] : anyValue ? [anyValue] : [];
  const [picked, setPicked] = useState<string[]>(start);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<string[]>(start);
  const rootRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const draftSet = useMemo(() => new Set(draft), [draft]);
  const anyOn = Boolean(anyValue && draftSet.has(anyValue));

  function commit(next: string[]) {
    setDraft(next);
    setPicked(next);
    onChange?.(next);
  }

  function openDialog() {
    if (disabled) return;
    setDraft(picked.length ? picked : anyValue ? [anyValue] : []);
    setOpen(true);
  }

  function toggle(value: string) {
    const cur = draft;
    const next =
      anyValue && value === anyValue
        ? anyOn
          ? []
          : [anyValue]
        : (() => {
            const withoutAny = anyValue ? cur.filter((v) => v !== anyValue) : cur;
            return withoutAny.includes(value)
              ? withoutAny.filter((v) => v !== value)
              : [...withoutAny, value];
          })();
    commit(next);
  }

  function chooseAny() {
    if (!anyValue) return;
    commit([anyValue]);
  }

  function clearDraft() {
    commit([]);
  }

  function apply() {
    commit(draft.length ? draft : anyValue ? [anyValue] : []);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    function onDoc(e: MouseEvent) {
      const node = e.target as Node;
      if (rootRef.current?.contains(node) || dialogRef.current?.contains(node)) return;
      apply();
    }
    window.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDoc);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onDoc);
    };
  }, [open, draft]);

  const submitted = open ? draft : picked;
  const chips = picked.map((value) =>
    value === anyValue ? anyText : (items.find((o) => o.value === value)?.label ?? value),
  );

  return (
    <div ref={rootRef} className={`hope-picker field-3d ${className}${disabled ? " is-disabled" : ""}${open ? " is-open" : ""}`}>
      <span className="field-3d-label">
        <FieldMark label={label} />
        {label}
        {help ? <FieldHelp text={help} /> : null}
      </span>
      {submitted.map((value) => (
        <input key={value} type="hidden" name={name} value={value} />
      ))}
      <input type="hidden" name={`${name}__joined`} value={submitted.join("|")} />
      <div className="hope-picker-row">
        <button type="button" className="hope-picker-trigger" onClick={openDialog} disabled={disabled}>
          <span className="hope-chips">
            {chips.length ? (
              chips.map((c) => <em key={c}>{c}</em>)
            ) : (
              <em>Nothing chosen</em>
            )}
          </span>
          <span className="hope-picker-action">{disabled ? "Locked" : "Choose"}</span>
        </button>
      </div>
      {disabled && disabledHint ? <p className="hope-picker-note">{disabledHint}</p> : null}
      {open && mounted
        ? createPortal(
            <div className="hope-dialog-layer">
              <button type="button" className="hope-dialog-scrim" aria-label="Close" onClick={() => setOpen(false)} />
              <div ref={dialogRef} className="hope-dialog" role="dialog" aria-label={label}>
                <p className="hope-dialog-kicker">Several may be chosen</p>
                <h3>{label}</h3>
                <p className="hope-dialog-hint">Tick only the ones that matter. Leave the rest unselected.</p>
                <div className="hope-dialog-quick">
                  {anyValue ? (
                    <button type="button" className={anyOn ? "is-on" : undefined} onClick={chooseAny}>
                      {anyText}
                    </button>
                  ) : null}
                  <button type="button" onClick={clearDraft}>
                    Clear all
                  </button>
                </div>
                <div className="hope-dialog-list">
                  {anyValue ? (
                    <label className={`hope-dialog-any ${anyOn ? "is-on" : ""}`}>
                      <input type="checkbox" checked={anyOn} onChange={() => toggle(anyValue)} />
                      <span>{anyText}</span>
                    </label>
                  ) : null}
                  {items.map((item) => (
                    <label key={item.value} className={draftSet.has(item.value) ? "is-on" : undefined}>
                      <input
                        type="checkbox"
                        checked={draftSet.has(item.value)}
                        onChange={() => toggle(item.value)}
                      />
                      <span>{item.label}</span>
                    </label>
                  ))}
                </div>
                <div className="hope-dialog-actions">
                  <button type="button" className="hope-dialog-cancel" onClick={() => setOpen(false)}>
                    Cancel
                  </button>
                  <button type="button" className="hope-dialog-done" onClick={apply}>
                    Use these choices
                  </button>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
