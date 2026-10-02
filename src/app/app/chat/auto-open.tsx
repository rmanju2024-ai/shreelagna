"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/** On wide screens, open the top conversation straight away (phones keep the list first). */
export function AutoOpen({ href }: { href: string }) {
  const router = useRouter();
  useEffect(() => {
    if (!window.matchMedia("(min-width: 821px)").matches) return;
    if (window.location.pathname === href) return;
    router.replace(href);
    // Hard fallback if the soft navigation did not land.
    const t = window.setTimeout(() => {
      if (window.location.pathname !== href) window.location.replace(href);
    }, 1500);
    return () => window.clearTimeout(t);
  }, [href, router]);
  return null;
}
