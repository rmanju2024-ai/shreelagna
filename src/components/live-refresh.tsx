"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/** Refreshes the page when a row changes in `table` for this filter (Supabase Realtime, RLS applies). */
export function LiveRefresh({ table, filter }: { table: string; filter?: string }) {
  const router = useRouter();
  useEffect(() => {
    let cleanup = () => {};
    let timer: number | undefined;
    void import("@/lib/supabase/client").then(({ createClient }) => {
      const supabase = createClient();
      const channel = supabase
        .channel(`live:${table}:${filter ?? "all"}`)
        .on("postgres_changes", { event: "*", schema: "public", table, ...(filter ? { filter } : {}) }, () => {
          window.clearTimeout(timer);
          timer = window.setTimeout(() => router.refresh(), 250);
        })
        .subscribe();
      cleanup = () => void supabase.removeChannel(channel);
    });
    return () => {
      window.clearTimeout(timer);
      cleanup();
    };
  }, [table, filter, router]);
  return null;
}
