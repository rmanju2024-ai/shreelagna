"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/desk/tickets", id: "tickets", label: "Ticketing", hint: "Contact from families" },
  { href: "/desk/safety", id: "safety", label: "Safety", hint: "Reports and blocks" },
  { href: "/desk/analytics", id: "analytics", label: "Analytics", hint: "Pulse, place, people" },
  { href: "/desk/audit", id: "audit", label: "Audit", hint: "Staff and admin log" },
  { href: "/desk/profiles", id: "profiles", label: "Profiles", hint: "Review or find by ID" },
  { href: "/desk/staff", id: "staff", label: "Staff", hint: "Appoint and remove" },
  { href: "/desk/plans", id: "plans", label: "Plans", hint: "Confirm membership" },
] as const;

export function DeskNav({ admin }: { admin: boolean }) {
  const path = usePathname();
  return (
    <nav className="browse-views" aria-label="House desk">
      <p className="browse-kicker">{admin ? "Admin" : "Staff"}</p>
      {ITEMS.map((item) => {
        const on = path === item.href || path.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.id}
            prefetch
            href={item.href}
            aria-current={on ? "page" : undefined}
            className={`browse-view${on ? " is-on" : ""}`}
          >
            <span>
              <b>{item.label}</b>
              <small>{item.id === "analytics" && admin ? "House and staff" : item.hint}</small>
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
