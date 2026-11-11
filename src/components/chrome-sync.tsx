"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export const CHROME_BADGE_REFRESH_MS = 180_000;

/**
 * Quietly refresh dock badges while the tab stays open.
 * Do not router.refresh() on every Inbox click — that re-ran the whole page and felt slow.
 */
export function ChromeSync() {
  const router = useRouter();

  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState === "visible" && navigator.onLine) router.refresh();
    };
    const tick = window.setInterval(refresh, CHROME_BADGE_REFRESH_MS);
    window.addEventListener("online", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.clearInterval(tick);
      window.removeEventListener("online", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [router]);

  return null;
}
