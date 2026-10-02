"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/** On wide screens, open the top conversation straight away (phones keep the list first). */
export function AutoOpen({ href }: { href: string }) {
  const router = useRouter();
  useEffect(() => {
    if (window.matchMedia("(min-width: 821px)").matches) router.replace(href);
  }, [href, router]);
  return null;
}
