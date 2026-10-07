import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

/** Close a popup or overlay immediately: prefer history back, then the fallback page. */
export function dismissTo(router: AppRouterInstance, fallback: string) {
  if (typeof window === "undefined") {
    router.replace(fallback);
    return;
  }
  const here = `${window.location.pathname}${window.location.search}`;
  if (window.history.length > 1) {
    router.back();
    window.setTimeout(() => {
      if (`${window.location.pathname}${window.location.search}` === here) {
        router.replace(fallback);
      }
    }, 120);
    return;
  }
  router.replace(fallback);
}

const PROFILE_LEAVE: Record<string, { href: string; label: string }> = {
  shortlist: { href: "/app/shortlist", label: "Back to shortlist" },
  blocked: { href: "/app/blocked", label: "Back to blocked" },
  likes: { href: "/app/interests", label: "Back to interests" },
  alerts: { href: "/app/alerts", label: "Back to alerts" },
  chat: { href: "/app/chat", label: "Back to inbox" },
  discover: { href: "/browse", label: "Close" },
  look: { href: "/desk/look", label: "Back to Look" },
  desk: { href: "/desk/profiles", label: "Back to profiles" },
  safety: { href: "/desk/safety", label: "Back to safety" },
  plans: { href: "/app/plans", label: "Back to membership" },
};

export function profileLeaveTarget(from?: string | null) {
  if (from && PROFILE_LEAVE[from]) return PROFILE_LEAVE[from];
  return { href: "/browse", label: "Close" };
}

export function profileOpenHref(id: string, from: string) {
  return `/browse/${id}?from=${encodeURIComponent(from)}`;
}

export function withProfileFrom(href: string, from: string) {
  if (!href.startsWith("/browse/") || href.includes("/report")) return href;
  if (/[?&]from=/.test(href)) return href;
  return href.includes("?") ? `${href}&from=${encodeURIComponent(from)}` : `${href}?from=${encodeURIComponent(from)}`;
}
