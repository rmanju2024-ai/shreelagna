"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/desk/analytics", label: "Pulse", hint: "House totals" },
  { href: "/desk/analytics/place", label: "Place", hint: "State, city, abroad" },
  { href: "/desk/analytics/people", label: "People", hint: "Age, work, family" },
  { href: "/desk/analytics/health", label: "Health", hint: "Quiet, complete, media" },
] as const;

export function AnalyticsTabs() {
  const path = usePathname();
  return (
    <nav className="desk-tabs" aria-label="Analytics">
      {TABS.map((tab) => {
        const on = tab.href === "/desk/analytics" ? path === tab.href : path.startsWith(tab.href);
        return (
          <Link key={tab.href} href={tab.href} className={`desk-tab${on ? " is-on" : ""}`} aria-current={on ? "page" : undefined}>
            <b>{tab.label}</b>
            <small>{tab.hint}</small>
          </Link>
        );
      })}
    </nav>
  );
}
