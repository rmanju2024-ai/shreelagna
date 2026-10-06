"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { createPortal } from "react-dom";
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { NavGlyph } from "@/components/nav-icons";
import { SignOutButton } from "@/components/sign-out-button";
import { InstallAppMenuItem } from "@/components/install-app";
import { unreadLabel } from "@/lib/match/chat-ui";
import { placeMoreMenu } from "@/lib/ui/place-float";

function pathMatches(pathname: string, href: string, tab: string | null) {
  if (href === "/") return pathname === "/";
  if (href === "/app/settings") return pathname === "/app/settings";
  if (href === "/app/plans") return pathname === "/app/plans" || pathname.startsWith("/app/plans/");
  if (href === "/app/account") {
    return pathname === "/app/account" || pathname.startsWith("/app/account/");
  }
  if (href === "/app") {
    return pathname === "/app" || pathname.startsWith("/app/profiles");
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

type NavItem = { href: string; label: string; icon: string; badge?: number };

function NavChip({
  item,
  overlay,
  current,
}: {
  item: NavItem;
  overlay: boolean;
  current: boolean;
}) {
  const badge = unreadLabel(item.badge ?? 0);
  return (
    <Link
      href={item.href}
      aria-current={current ? "page" : undefined}
      className={`nav-3d${overlay ? " is-overlay" : ""}${current ? " is-on" : ""}`}
    >
      <span className="nav-3d-ico">
        <NavGlyph name={item.icon} />
      </span>
      <span className="nav-3d-label">{item.label}</span>
      {badge ? <b className="nav-badge">{badge}</b> : null}
    </Link>
  );
}

function MenuLink({ item, current }: { item: NavItem; current: boolean }) {
  const badge = unreadLabel(item.badge ?? 0);
  return (
    <Link href={item.href} role="menuitem" className={`nav-menu-item${current ? " is-on" : ""}`}>
      <span className="nav-3d-ico">
        <NavGlyph name={item.icon} />
      </span>
      <span>{item.label}</span>
      {badge ? <b className="nav-menu-badge">{badge}</b> : null}
    </Link>
  );
}

function NavGroup({
  label,
  icon,
  overlay,
  current,
  badge,
  star,
  children,
}: {
  label: string;
  icon: string;
  overlay: boolean;
  current: boolean;
  badge?: number;
  star?: "admin" | "staff";
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [menuStyle, setMenuStyle] = useState<CSSProperties>();
  const ref = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const mark = unreadLabel(badge ?? 0);

  useEffect(() => {
    function onDoc(event: MouseEvent) {
      const target = event.target as Node;
      if (!ref.current?.contains(target) && !menuRef.current?.contains(target)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  useLayoutEffect(() => {
    if (!open) {
      setMenuStyle(undefined);
      return;
    }
    function place() {
      const el = triggerRef.current;
      if (!el) return;
      setMenuStyle(placeMoreMenu(el));
    }
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open]);

  const menu = open ? (
    <div
      ref={menuRef}
      className={`nav-menu${mobile ? " is-mobile-sheet" : ""}`}
      role="menu"
      style={menuStyle}
      onClick={() => setOpen(false)}
    >
      {children}
    </div>
  ) : null;

  return (
    <div className="nav-group" ref={ref}>
      <button
        ref={triggerRef}
        type="button"
        className={`nav-3d${overlay ? " is-overlay" : ""}${current || open ? " is-on" : ""}`}
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => {
          setMobile(window.matchMedia("(max-width: 820px)").matches);
          setOpen((value) => !value);
        }}
      >
        <span className="nav-3d-ico">
          <NavGlyph name={icon} />
        </span>
        <span className="nav-3d-label">{label}</span>
        {star ? (
          <span
            className={`nav-star is-${star}`}
            title={star === "admin" ? "Admin" : "Staff"}
            aria-label={star === "admin" ? "Admin" : "Staff"}
          >
            {star === "admin" ? "★★" : "★"}
          </span>
        ) : null}
        <span className="nav-3d-caret" aria-hidden>
          {"\u25BE"}
        </span>
        {mark ? <b className="nav-badge">{mark}</b> : null}
      </button>
      {mobile && menu ? createPortal(menu, document.body) : menu}
    </div>
  );
}

export function HeaderNav({
  overlay,
  user,
  staff,
  chatUnread = 0,
  alertUnread = 0,
  likesPending = 0,
}: {
  overlay: boolean;
  user: boolean;
  staff: boolean;
  chatUnread?: number;
  alertUnread?: number;
  likesPending?: number;
}) {
  const pathname = usePathname();
  const tab = useSearchParams().get("tab");
  const [dock, setDock] = useState(false);
  const more: NavItem[] = [
    { href: "/about", label: "About", icon: "about" },
    { href: "/contact", label: "Help", icon: "help" },
  ];
  const desk: NavItem = { href: "/desk", label: "Desk", icon: "staff" };
  const registerHere = pathMatches(pathname, "/login", tab);
  const moreOn = more.some((item) => pathMatches(pathname, item.href, tab));

  useLayoutEffect(() => {
    const mq = window.matchMedia("(max-width: 820px)");
    const sync = () => setDock(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const nav = (
    <nav aria-label="Primary" className={`site-nav${overlay ? " is-overlay" : ""}${dock ? " is-mobile-dock" : ""}`}>
      <div className="site-nav-row">
        <NavChip item={{ href: "/", label: "Home", icon: "home" }} overlay={overlay} current={pathMatches(pathname, "/", tab)} />
        <NavChip item={{ href: "/browse", label: "Discover", icon: "browse" }} overlay={overlay} current={pathMatches(pathname, "/browse", tab)} />
        {user ? (
          <NavChip
            item={{ href: "/app/account", label: "Account", icon: "account", badge: chatUnread + alertUnread + likesPending }}
            overlay={overlay}
            current={pathMatches(pathname, "/app/account", tab)}
          />
        ) : (
          <Link href="/login" aria-current={registerHere ? "page" : undefined} className={`nav-3d${overlay ? " is-overlay" : ""}${registerHere ? " is-on" : ""}`}>
            <span className="nav-3d-ico">
              <NavGlyph name="profile" />
            </span>
            <span className="nav-3d-label">Sign in</span>
          </Link>
        )}
        {staff ? <NavChip item={desk} overlay={overlay} current={pathMatches(pathname, desk.href, tab)} /> : null}
        <NavGroup
          label="More"
          icon="more"
          overlay={overlay}
          current={moreOn}
        >
          {more.map((item) => <MenuLink key={item.href} item={item} current={pathMatches(pathname, item.href, tab)} />)}
          <InstallAppMenuItem />
          {user ? <SignOutButton className="nav-menu-item" icon /> : null}
        </NavGroup>
      </div>
    </nav>
  );

  if (dock) return createPortal(nav, document.body);
  return nav;
}
