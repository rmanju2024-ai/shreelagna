"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

const INBOX = ["/app/chat", "/app/alerts", "/app/interests"];

/**
 * The header now stays in place between pages, so its badge counts are refreshed here:
 * shortly after entering an Inbox page, and quietly once a minute while the tab is visible.
 */
export function ChromeSync() {
  const router = useRouter();
  const pathname = usePathname();
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (!INBOX.some((path) => pathname.startsWith(path))) return;
    const timer = window.setTimeout(() => router.refresh(), 1500);
    return () => window.clearTimeout(timer);
  }, [pathname, router]);

  useEffect(() => {
    const tick = window.setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, 60_000);
    return () => window.clearInterval(tick);
  }, [router]);

  return null;
}
