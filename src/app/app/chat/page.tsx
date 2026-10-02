import { Suspense } from "react";
import { ChatSidebar, ChatSidebarSkeleton } from "@/app/app/chat/chat-sidebar";
import { LiveRefresh } from "@/components/live-refresh";
import { PageShell } from "@/components/site-chrome";

export default function ChatListPage() {
  return (
    <PageShell>
      <LiveRefresh table="messages" />
      <div className="wc-shell">
        <Suspense fallback={<ChatSidebarSkeleton />}>
          <ChatSidebar />
        </Suspense>
        <section className="wc-welcome" aria-label="No chat selected">
          <div>
            <span className="gz-emoji" aria-hidden>💬</span>
            <h2>Your conversations</h2>
            <p>Pick a match on the left to start chatting.</p>
          </div>
        </section>
      </div>
    </PageShell>
  );
}
