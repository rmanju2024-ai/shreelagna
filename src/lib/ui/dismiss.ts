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
