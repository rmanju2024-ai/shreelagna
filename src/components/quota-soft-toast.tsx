"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { fetchQuotaSoftNotice } from "@/lib/membership/quota-notice-action";
import type { QuotaSoftNotice } from "@/lib/membership/quota-notice";

const EVENT = "mc-quota-soft";
const LOGIN_DELAY_MS = 30_000;
const LOGIN_KEY = (userId: string) => `mc-quota-login:${userId}`;

export function emitQuotaSoft(notice: QuotaSoftNotice | null | undefined) {
  if (!notice || typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(EVENT, { detail: notice }));
}

export function clearQuotaLoginReminder(userId?: string) {
  if (typeof sessionStorage === "undefined") return;
  if (userId) {
    sessionStorage.removeItem(LOGIN_KEY(userId));
    return;
  }
  for (let i = sessionStorage.length - 1; i >= 0; i -= 1) {
    const key = sessionStorage.key(i);
    if (key?.startsWith("mc-quota-login:")) sessionStorage.removeItem(key);
  }
}

/** Once per login, 30 seconds after sign-in, on whatever page the member is on. */
export function QuotaLoginReminder({ userId }: { userId: string }) {
  useEffect(() => {
    const key = LOGIN_KEY(userId);
    type Rec = { startedAt: number; shown: boolean };
    let rec: Rec = { startedAt: Date.now(), shown: false };
    try {
      const raw = sessionStorage.getItem(key);
      if (raw) rec = { ...rec, ...(JSON.parse(raw) as Rec) };
    } catch {
      /* keep default */
    }
    if (rec.shown) return;
    sessionStorage.setItem(key, JSON.stringify(rec));
    const wait = Math.max(0, LOGIN_DELAY_MS - (Date.now() - rec.startedAt));
    const timer = window.setTimeout(() => {
      void fetchQuotaSoftNotice().then((notice) => {
        if (notice) emitQuotaSoft(notice);
        sessionStorage.setItem(key, JSON.stringify({ ...rec, shown: true }));
      });
    }, wait);
    return () => window.clearTimeout(timer);
  }, [userId]);
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

  // No auto-dismiss — popup stays until the visitor clicks ✕

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
