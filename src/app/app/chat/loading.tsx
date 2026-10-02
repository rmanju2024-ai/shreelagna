import { ChatSidebarSkeleton } from "@/app/app/chat/chat-sidebar";
import { PageShell } from "@/components/site-chrome";

/** Shows the chat frame at once while the conversation list loads. */
export default function Loading() {
  return (
    <PageShell>
      <div className="wc-shell">
        <ChatSidebarSkeleton />
        <section className="wc-welcome" aria-hidden>
          <div>
            <span className="gz-emoji">💬</span>
            <h2>Loading chats…</h2>
          </div>
        </section>
      </div>
    </PageShell>
  );
}
