"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { pingPresence } from "@/app/app/presence";
import { createClient } from "@/lib/supabase/client";

const PING_EVERY_MS = 2 * 60 * 1000;

/** Keep Gmail cookies in sync, and stamp last seen while a member is on the house. */
export function SyncSession({ guest }: { guest: boolean }) {
  const router = useRouter();
  const tried = useRef(false);

  useEffect(() => {
    if (!guest || tried.current) return;
    tried.current = true;
    let cancelled = false;
    void (async () => {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!cancelled && user) router.refresh();
      } catch {
        /* stay as guest */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [guest, router]);

  useEffect(() => {
    if (guest) return;
    // Server actions queue behind navigation, so never fire one on page load and
    // never more than once per interval across page changes.
    const beat = () => {
      try {
        const last = Number(sessionStorage.getItem("sl-ping") ?? 0);
        if (Date.now() - last < PING_EVERY_MS) return;
        sessionStorage.setItem("sl-ping", String(Date.now()));
      } catch {
        /* ignore */
      }
      void pingPresence();
    };
    const first = window.setTimeout(beat, 6000);
    const id = window.setInterval(beat, PING_EVERY_MS);
    const onVis = () => {
      if (document.visibilityState === "visible") beat();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [guest]);

  return null;
}
