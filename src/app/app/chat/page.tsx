import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { AlertsFeed } from "@/app/app/alerts/alerts-feed";
import { ChatSidebar, firstChatId } from "@/app/app/chat/chat-sidebar";
import { LiveRefresh } from "@/components/live-refresh";
import { PageShell } from "@/components/site-chrome";

export default async function ChatListPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab } = await searchParams;
  const alertsTab = tab === "alerts";
  // Desktop: open the top conversation straight away (server-side, no flash, no client hop).
  // Phones keep the list first.
  const h = await headers();
  const mobile = h.get("sec-ch-ua-mobile") === "?1" || /Mobi|Android|iPhone|iPad/i.test(h.get("user-agent") ?? "");
  if (!alertsTab && !mobile) {
    const first = await firstChatId();
    if (first) redirect(`/app/chat/${first}`);
  }
  return (
    <PageShell>
      <LiveRefresh table="messages" />
      <div className={`inbox-unified${alertsTab ? " is-alerts" : ""}`}>
        <nav className="inbox-switcher" aria-label="Inbox sections">
          <Link href="/app/chat" className={!alertsTab ? "is-on" : undefined} aria-current={!alertsTab ? "page" : undefined}>💬 Chats</Link>
          <Link href="/app/chat?tab=alerts" className={alertsTab ? "is-on" : undefined} aria-current={alertsTab ? "page" : undefined}>🔔 Alerts</Link>
        </nav>
        {alertsTab ? (
          <section className="inbox-alerts-panel" aria-label="Alerts">
            <header><p>Your private inbox</p><h1>Updates</h1></header>
            <AlertsFeed />
          </section>
        ) : (
          <div className="wc-shell">
            <ChatSidebar />
            <section className="wc-welcome" aria-label="No chat selected">
              <div>
                <span className="gz-emoji" aria-hidden>💬</span>
                <h2>Your conversations</h2>
                <p>Pick a match on the left to start chatting.</p>
              </div>
            </section>
          </div>
        )}
      </div>
    </PageShell>
  );
}
