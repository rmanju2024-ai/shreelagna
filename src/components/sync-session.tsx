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
    const beat = () => {
      void pingPresence();
    };
    beat();
    const id = window.setInterval(beat, PING_EVERY_MS);
    const onVis = () => {
      if (document.visibilityState === "visible") beat();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [guest]);

  return null;
}
