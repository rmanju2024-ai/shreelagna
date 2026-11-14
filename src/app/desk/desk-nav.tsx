"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NavGlyph } from "@/components/nav-icons";

export const DESK_ITEMS = [
  { href: "/desk/tickets", id: "tickets", icon: "tickets", label: "Ticketing", hint: "Contact from families" },
  { href: "/desk/media", id: "media", icon: "look", label: "Media", hint: "Photos and intros" },
  { href: "/desk/people", id: "people", icon: "profile", label: "People", hint: "One member file" },
  { href: "/desk/safety", id: "safety", icon: "safety", label: "Safety", hint: "Reports and blocks" },
  { href: "/desk/analytics", id: "analytics", icon: "analytics", label: "Analytics", hint: "Pulse, place, people" },
  { href: "/desk/audit", id: "audit", icon: "audit", label: "Audit", hint: "Staff and admin log" },
  { href: "/desk/profiles", id: "profiles", icon: "profile", label: "Profiles", hint: "Review or find by ID" },
  { href: "/desk/look", id: "look", icon: "look", label: "Look", hint: "Filter bride and groom" },
  { href: "/desk/verification", id: "verification", icon: "verify", label: "Verification", hint: "Restricted evidence review", adminOnly: true },
  { href: "/desk/staff", id: "staff", icon: "staff", label: "Staff", hint: "Appoint and remove" },
  { href: "/desk/plans", id: "plans", icon: "plans", label: "Plans", hint: "Confirm membership" },
] as const;

export function deskItemsFor(admin: boolean) {
  return DESK_ITEMS.filter((item) => !("adminOnly" in item && item.adminOnly) || admin);
}

function isOn(path: string, href: string) {
  return path === href || path.startsWith(`${href}/`);
}

export function DeskNav({ admin }: { admin: boolean }) {
  const path = usePathname();
  const items = deskItemsFor(admin);
  return (
    <nav className="desk-menu is-rail" aria-label="House desk">
      {items.map((item) => {
        const on = isOn(path, item.href);
        return (
          <Link
            key={item.id}
            prefetch
            href={item.href}
            aria-current={on ? "page" : undefined}
            className={`desk-menu-chip${on ? " is-on" : ""}`}
            data-desk={item.id}
          >
            <span className="desk-menu-ico" aria-hidden>
              <NavGlyph name={item.icon} />
            </span>
            <b>{item.label}</b>
          </Link>
        );
      })}
    </nav>
  );
}
