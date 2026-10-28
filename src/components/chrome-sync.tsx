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
    const tick = window.setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, CHROME_BADGE_REFRESH_MS);
    return () => window.clearInterval(tick);
  }, [router]);

  return null;
}
