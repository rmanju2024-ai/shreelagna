"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NavGlyph } from "@/components/nav-icons";

export const DESK_ITEMS = [
  { href: "/desk/profiles", id: "profiles", icon: "profile", label: "Review", hint: "Queue and ID search", group: "review" },
  { href: "/desk/media", id: "media", icon: "look", label: "Media", hint: "Changes on live profiles", group: "review" },
  { href: "/desk/tickets", id: "tickets", icon: "tickets", label: "Tickets", hint: "Family requests", group: "review" },
  { href: "/desk/safety", id: "safety", icon: "safety", label: "Safety", hint: "Reports and blocks", group: "review" },
  { href: "/desk/verification", id: "verification", icon: "verify", label: "Verify", hint: "Identity cases", group: "review" },
  { href: "/desk/analytics", id: "analytics", icon: "analytics", label: "Insights", hint: "Totals and place", group: "analytics" },
  { href: "/desk/audit", id: "audit", icon: "audit", label: "Audit", hint: "Staff and admin log", group: "analytics" },
  { href: "/desk/people", id: "people", icon: "profile", label: "Members", hint: "One member file", group: "analytics" },
  { href: "/desk/look", id: "look", icon: "look", label: "Browse", hint: "Live bride and groom list", group: "analytics" },
  { href: "/desk/plans", id: "plans", icon: "plans", label: "Plans", hint: "Membership", group: "analytics" },
  { href: "/desk/staff", id: "staff", icon: "staff", label: "Staff", hint: "Appoint and remove", group: "analytics", adminOnly: true },
] as const;

const GROUPS = [
  { id: "review", label: "Review" },
  { id: "analytics", label: "Analytics" },
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
      {GROUPS.map((group) => {
        const groupItems = items.filter((item) => item.group === group.id);
        if (!groupItems.length) return null;
        return (
          <div key={group.id} className="desk-menu-group" aria-label={group.label}>
            <p className="desk-menu-group-label">{group.label}</p>
            <div className="desk-menu-group-row">
              {groupItems.map((item) => {
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
            </div>
          </div>
        );
      })}
    </nav>
  );
}
