"use client";

import {
  Children,
  isValidElement,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
  type CSSProperties,
  type SelectHTMLAttributes,
} from "react";
import { createPortal } from "react-dom";
import { placeFloat } from "@/lib/ui/place-float";

type Item = { value: string; label: string; disabled?: boolean };

function readOptions(children: ReactNode): Item[] {
  const items: Item[] = [];
  Children.forEach(children, (child) => {
    if (!isValidElement(child) || child.type !== "option") return;
    const props = child.props as { value?: string | number; children?: ReactNode; disabled?: boolean };
    const label = Children.toArray(props.children).join("").trim();
    items.push({
      value: props.value != null ? String(props.value) : label,
      label: label || String(props.value ?? ""),
      disabled: Boolean(props.disabled),
    });
  });
  return items;
}

function fromItems(items: string[]): Item[] {
  return items.map((item) => ({ value: item, label: item }));
}

export function Select3d({
  name,
  value,
  defaultValue,
  onChange,
  disabled,
  required,
  className = "",
  children,
  id,
  multiple = false,
  values,
  onValuesChange,
  anyLabel,
  items,
  "aria-label": ariaLabel,
}: SelectHTMLAttributes<HTMLSelectElement> & {
  multiple?: boolean;
  values?: string[];
  onValuesChange?: (next: string[]) => void;
  anyLabel?: string;
  items?: string[];
}) {
  const options = useMemo(() => {
    const rows = items ? fromItems(items) : readOptions(children);
    return multiple ? rows.filter((row) => row.value !== "") : rows;
  }, [items, children, multiple]);
  const reactId = useId();
  const listId = `${reactId}-list`;
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [menuStyle, setMenuStyle] = useState<CSSProperties>();
  const [active, setActive] = useState(0);
  const [inner, setInner] = useState(String(defaultValue ?? value ?? ""));
  const [innerList, setInnerList] = useState<string[]>(values ?? []);
  const current = value != null ? String(value) : inner;
  const picked = values ?? innerList;
  const pickedSet = useMemo(() => new Set(picked), [picked]);
  const selected = useMemo(() => options.find((item) => item.value === current), [options, current]);
  const selectedMany = useMemo(() => options.filter((item) => pickedSet.has(item.value)), [options, pickedSet]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (value != null) setInner(String(value));
  }, [value]);

  useEffect(() => {
    if (values) setInnerList(values);
  }, [values]);

  useEffect(() => {
    if (!open) return;
    setActive(0);
    function onDoc(event: MouseEvent) {
      const node = event.target as Node;
      if (triggerRef.current?.contains(node) || menuRef.current?.contains(node)) return;
      setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        triggerRef.current?.focus();
      }
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useLayoutEffect(() => {
    if (!open) {
      setMenuStyle(undefined);
      return;
    }
    function place() {
      const el = triggerRef.current;
      if (!el) return;
      setMenuStyle(placeFloat(el));
    }
    place();
    window.addEventListener("scroll", place, true);
    window.addEventListener("resize", place);
    return () => {
      window.removeEventListener("scroll", place, true);
      window.removeEventListener("resize", place);
    };
  }, [open]);

  function emit(next: string) {
    setInner(next);
    onChange?.({
      target: { name: name ?? "", value: next },
      currentTarget: { name: name ?? "", value: next },
    } as ChangeEvent<HTMLSelectElement>);
  }

  function emitList(next: string[]) {
    setInnerList(next);
    onValuesChange?.(next);
  }

  function choose(item: Item) {
    if (item.disabled) return;
    if (multiple) {
      emitList(pickedSet.has(item.value) ? picked.filter((row) => row !== item.value) : [...picked, item.value]);
      return;
    }
    emit(item.value);
    setOpen(false);
    triggerRef.current?.focus();
  }

  function onTriggerKey(event: ReactKeyboardEvent<HTMLButtonElement>) {
    if (disabled) return;
    if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setOpen(true);
    }
  }

  function onMenuKey(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((i) => Math.min(options.length - 1, i + 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((i) => Math.max(0, i - 1));
    } else if (event.key === "Enter") {
      event.preventDefault();
      const item = options[active];
      if (item) choose(item);
    }
  }

  const multiLabel =
    selectedMany.length === 0
      ? anyLabel || "Any"
      : selectedMany.length <= 2
        ? selectedMany.map((item) => item.label).join(", ")
        : `${selectedMany.length} chosen`;

  return (
    <div className={`select-3d${disabled ? " is-disabled" : ""}${multiple ? " is-multi" : ""}${open ? " is-open" : ""}`}>
      {multiple
        ? picked.map((item) => <input key={item} type="hidden" name={name} value={item} />)
        : (
            <select
              id={id}
              className="select-3d-native"
              tabIndex={-1}
              aria-hidden
              name={name}
              required={required}
              disabled={disabled}
              value={current}
              onChange={(event) => emit(event.target.value)}
            >
              {items
                ? options.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))
                : children}
            </select>
          )}
      <button
        ref={triggerRef}
        type="button"
        className={`select-3d-trigger ${className}`.trim()}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-label={ariaLabel}
        aria-multiselectable={multiple || undefined}
        onClick={() => {
          if (disabled) return;
          setOpen((next) => !next);
        }}
        onKeyDown={onTriggerKey}
      >
        <span className={multiple ? (selectedMany.length ? undefined : "is-placeholder") : selected?.label ? undefined : "is-placeholder"}>
          {multiple ? multiLabel : selected?.label || "Select"}
        </span>
        <i aria-hidden />
      </button>
      {open && mounted && menuStyle
        ? createPortal(
            <div
              ref={menuRef}
              id={listId}
              className={`select-3d-menu${multiple ? " is-multi" : ""}`}
              role="listbox"
              aria-label={ariaLabel}
              style={menuStyle}
              onKeyDown={onMenuKey}
            >
              {multiple ? (
                <button type="button" className={`select-3d-option${picked.length === 0 ? " is-on" : ""}`} onClick={() => emitList([])}>
                  <em className="select-3d-tick" aria-hidden>
                    ✓
                  </em>
                  {anyLabel || "Any"}
                </button>
              ) : null}
              <div className="select-3d-options">
                {options.length ? (
                  options.map((item, index) => (
                    <button
                      key={item.value}
                      type="button"
                      role="option"
                      disabled={item.disabled}
                      aria-selected={multiple ? pickedSet.has(item.value) : item.value === current}
                      className={`select-3d-option${multiple && pickedSet.has(item.value) ? " is-on" : ""}${!multiple && item.value === current ? " is-on" : ""}${index === active ? " is-active" : ""}`}
                      onMouseEnter={() => setActive(index)}
                      onClick={() => choose(item)}
                    >
                      {multiple ? (
                        <em className="select-3d-tick" aria-hidden>
                          ✓
                        </em>
                      ) : null}
                      {item.label}
                    </button>
                  ))
                ) : (
                  <p className="select-3d-empty">No choices</p>
                )}
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
