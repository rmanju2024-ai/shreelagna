"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { dismissTo } from "@/lib/ui/dismiss";

/** Closes the current overlay or page: history back when possible, otherwise the fallback. */
export function BackLink({ fallback, className, children }: { fallback: string; className?: string; children: ReactNode }) {
  const router = useRouter();
  return (
    <a
      href={fallback}
      className={className}
      onClick={(event) => {
        event.preventDefault();
        dismissTo(router, fallback);
      }}
    >
      {children}
    </a>
  );
}
