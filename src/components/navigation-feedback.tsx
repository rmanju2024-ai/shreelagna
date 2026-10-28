"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export function NavigationFeedback() {
  const pathname = usePathname();
  const search = useSearchParams();
  const query = search.toString();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(false);
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [pathname, query]);

  useEffect(() => {
    function onClick(event: MouseEvent) {
      const target = event.target instanceof Element ? event.target.closest("a[href]") : null;
      if (!target || event.defaultPrevented || (event.button !== 0 && event.button != null) || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const href = target.getAttribute("href");
      if (!href || href.startsWith("#") || target.getAttribute("target") === "_blank" || !href.startsWith("/")) return;
      setLoading(true);
    }
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  return (
    <div
      className={`nav-progress${loading ? " is-loading" : ""}`}
      role={loading ? "status" : undefined}
      aria-label={loading ? "Loading" : undefined}
      aria-hidden={loading ? undefined : true}
    />
  );
}
