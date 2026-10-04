"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

/** Goes back in history when the member came from inside the app, otherwise to the fallback page. */
export function BackLink({ fallback, className, children }: { fallback: string; className?: string; children: ReactNode }) {
  const router = useRouter();
  return (
    <a
      href={fallback}
      className={className}
      onClick={(event) => {
        event.preventDefault();
        const cameFromHere = typeof document !== "undefined" && document.referrer.startsWith(window.location.origin) && !document.referrer.includes("/report");
        if (cameFromHere && window.history.length > 1) router.back();
        else router.push(fallback);
      }}
    >
      {children}
    </a>
  );
}
