"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { QuotaSoftNotice } from "@/lib/membership/quota-notice";

const EVENT = "mc-quota-soft";

export function emitQuotaSoft(notice: QuotaSoftNotice | null | undefined) {
  if (!notice || typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(EVENT, { detail: notice }));
}

export function QuotaSoftBeacon({ notice, onceKey }: { notice: QuotaSoftNotice | null; onceKey?: string }) {
  useEffect(() => {
    if (!notice) return;
    if (onceKey && typeof sessionStorage !== "undefined") {
      const stamped = sessionStorage.getItem(onceKey);
      if (stamped) return;
      sessionStorage.setItem(onceKey, "1");
    }
    emitQuotaSoft(notice);
  }, [notice, onceKey]);
  return null;
}

export function QuotaSoftHost() {
  const [notice, setNotice] = useState<QuotaSoftNotice | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function onNotice(event: Event) {
      const detail = (event as CustomEvent<QuotaSoftNotice>).detail;
      if (!detail?.title) return;
      setNotice(detail);
      setVisible(true);
    }
    window.addEventListener(EVENT, onNotice);
    return () => window.removeEventListener(EVENT, onNotice);
  }, []);

  useEffect(() => {
    if (!visible || !notice) return;
    const hide = window.setTimeout(() => setVisible(false), notice.holdMs);
    const clear = window.setTimeout(() => setNotice(null), notice.holdMs + 420);
    return () => {
      window.clearTimeout(hide);
      window.clearTimeout(clear);
    };
  }, [visible, notice]);

  if (!notice || typeof document === "undefined") return null;

  return createPortal(
    <aside
      className={`quota-soft${visible ? " is-on" : ""}${notice.kind === "capped" || notice.kind === "daily" ? " is-alert" : notice.kind === "warn" ? " is-warn" : ""}`}
      role="status"
      aria-live="polite"
    >
      <button type="button" className="quota-soft-dismiss" aria-label="Dismiss" onClick={() => setVisible(false)}>
        ✕
      </button>
      <p>{notice.title}</p>
      <span>{notice.body}</span>
    </aside>,
    document.body,
  );
}
