import Link from "next/link";

export type InboxTab = "chats" | "likes" | "alerts";

const TABS: { id: InboxTab; href: string; label: string }[] = [
  { id: "chats", href: "/app/chat", label: "💬 Chats" },
  { id: "likes", href: "/app/interests", label: "💌 Likes" },
  { id: "alerts", href: "/app/chat?tab=alerts", label: "🔔 Alerts" },
];

/** One place for the three parts of the Inbox: Chats, Likes and Alerts. */
export function InboxSwitcher({ active }: { active: InboxTab }) {
  return (
    <nav className="inbox-switcher" aria-label="Inbox sections">
      {TABS.map((tab) => (
        <Link
          key={tab.id}
          href={tab.href}
          className={tab.id === active ? "is-on" : undefined}
          aria-current={tab.id === active ? "page" : undefined}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
