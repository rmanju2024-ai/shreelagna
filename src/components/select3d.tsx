"use client";

import {
  Children,
  isValidElement,
  useDeferredValue,
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

type Item = { value: string; label: string; disabled?: boolean };

const LIST_CAP = 80;

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
  const searchRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState<CSSProperties>();
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [active, setActive] = useState(0);
  const [inner, setInner] = useState(String(defaultValue ?? value ?? ""));
  const [innerList, setInnerList] = useState<string[]>(values ?? []);
  const current = value != null ? String(value) : inner;
  const picked = values ?? innerList;
  const pickedSet = useMemo(() => new Set(picked), [picked]);
  const selected = useMemo(() => options.find((item) => item.value === current), [options, current]);
  const selectedMany = useMemo(() => options.filter((item) => pickedSet.has(item.value)), [options, pickedSet]);
  const searchable = options.length > 10;
  const minChars = options.length > 80 ? 2 : 1;
  const shown = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    const ready = q.length >= minChars;
    let rows = options;
    if (ready) {
      rows = options.filter((item) => item.label.toLowerCase().includes(q) || item.value.toLowerCase().includes(q));
    }
    const head = rows.slice(0, LIST_CAP);
    if (!ready) {
      const have = new Set(head.map((item) => item.value));
      for (const item of selectedMany) {
        if (!have.has(item.value)) {
          head.unshift(item);
          have.add(item.value);
        }
      }
    }
    return { rows: head, ready, hidden: Math.max(0, rows.length - head.length) };
  }, [options, deferredQuery, minChars, selectedMany]);

  useEffect(() => {
    if (value != null) setInner(String(value));
  }, [value]);

  useEffect(() => {
    if (values) setInnerList(values);
  }, [values]);

  useEffect(() => {
    if (!open) return;
    setActive(0);
    const t = window.setTimeout(() => searchRef.current?.focus(), 0);
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
      window.clearTimeout(t);
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
      const box = el.getBoundingClientRect();
      const spaceBelow = window.innerHeight - box.bottom;
      const openUp = spaceBelow < 240 && box.top > spaceBelow;
      const menuWidth = Math.min(Math.max(box.width, 13 * 16), window.innerWidth - 16);
      setMenuStyle({
        left: Math.min(Math.max(8, box.left), window.innerWidth - menuWidth - 8),
        width: menuWidth,
        maxHeight: Math.min(20 * 16, Math.max(8 * 16, openUp ? box.top - 16 : spaceBelow - 12)),
        top: openUp ? undefined : box.bottom + 6,
        bottom: openUp ? window.innerHeight - box.top + 6 : undefined,
      });
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
    setQuery("");
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
      setActive((i) => Math.min(shown.rows.length - 1, i + 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((i) => Math.max(0, i - 1));
    } else if (event.key === "Enter") {
      event.preventDefault();
      const item = shown.rows[active];
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
    <div className={`select-3d${disabled ? " is-disabled" : ""}${multiple ? " is-multi" : ""}`}>
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
          setQuery("");
          setOpen((next) => !next);
        }}
        onKeyDown={onTriggerKey}
      >
        <span className={multiple ? (selectedMany.length ? undefined : "is-placeholder") : selected?.label ? undefined : "is-placeholder"}>
          {multiple ? multiLabel : selected?.label || "Select"}
        </span>
        <i aria-hidden />
      </button>
      {open && menuStyle
        ? createPortal(
            <div
              ref={menuRef}
              id={listId}
              className={`select-3d-menu${multiple ? " is-multi" : ""}`}
              role="listbox"
              tabIndex={-1}
              aria-label={ariaLabel}
              style={menuStyle}
              onKeyDown={onMenuKey}
            >
              {searchable ? (
                <input
                  ref={searchRef}
                  className="select-3d-search"
                  type="search"
                  placeholder={minChars > 1 ? "Type 2 letters to find" : "Find a choice"}
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
              ) : null}
              {multiple ? (
                <button type="button" className={`select-3d-option${picked.length === 0 ? " is-on" : ""}`} onClick={() => emitList([])}>
                  <em className="select-3d-tick" aria-hidden>
                    ✓
                  </em>
                  {anyLabel || "Any"}
                </button>
              ) : null}
              <div className="select-3d-options">
                {shown.rows.length ? (
                  shown.rows.map((item, index) => (
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
                  <p className="select-3d-empty">{shown.ready ? "No matches" : `Type ${minChars} letters to search`}</p>
                )}
              </div>
              {shown.hidden ? <p className="select-3d-empty">Showing {LIST_CAP}. Type more to narrow.</p> : null}
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
