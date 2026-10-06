import Link from "next/link";
import { BackToAccount } from "@/components/back-to-account";
import { getAuth, ensureAppUser } from "@/lib/auth/session";
import { unreadLabel } from "@/lib/match/chat-ui";
import { unreadNoticeBadge } from "@/lib/notices/unread-badge";

export type InboxTab = "chats" | "likes" | "alerts";

const TABS: { id: InboxTab; href: string; label: string; countKey: "chatUnread" | "likesPending" | "alertUnread" }[] = [
  { id: "chats", href: "/app/chat", label: "💬 Chats", countKey: "chatUnread" },
  { id: "likes", href: "/app/interests", label: "💌 Likes", countKey: "likesPending" },
  { id: "alerts", href: "/app/alerts", label: "🔔 Alerts", countKey: "alertUnread" },
];

export function InboxSwitcherNav({
  active,
  counts = { chatUnread: 0, alertUnread: 0, likesPending: 0 },
}: {
  active: InboxTab;
  counts?: { chatUnread: number; alertUnread: number; likesPending: number };
}) {
  return (
    <div className="inbox-switcher-wrap">
      <BackToAccount />
      <nav className="inbox-switcher" aria-label="Inbox sections">
        {TABS.map((tab) => {
          const mark = unreadLabel(counts[tab.countKey]);
          return (
            <Link
              key={tab.id}
              href={tab.href}
              className={tab.id === active ? "is-on" : undefined}
              aria-current={tab.id === active ? "page" : undefined}
            >
              {tab.label}
              {mark ? <b className="inbox-switcher-badge">{mark}</b> : null}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

/** One place for the three parts of the Inbox: Chats, Likes and Alerts. */
export async function InboxSwitcher({ active }: { active: InboxTab }) {
  const { supabase, user } = await getAuth();
  const me = user && supabase ? await ensureAppUser(supabase, user) : null;
  const counts = me
    ? await unreadNoticeBadge(me.id).catch(() => ({ chatUnread: 0, alertUnread: 0, likesPending: 0 }))
    : { chatUnread: 0, alertUnread: 0, likesPending: 0 };
  return <InboxSwitcherNav active={active} counts={counts} />;
}
