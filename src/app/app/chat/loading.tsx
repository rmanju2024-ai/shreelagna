import { ChatSidebarSkeleton } from "@/app/app/chat/chat-sidebar";
import { InnerShell as PageShell } from "@/components/chrome-layout";

/** Shows the chat frame at once while the conversation list loads. */
export default function Loading() {
  return (
    <PageShell>
      <div className="wc-shell">
        <ChatSidebarSkeleton />
        <section className="wc-welcome wc-loading-welcome" aria-live="polite">
          <div className="wc-loading-orbit" aria-hidden>
            <span>✦</span>
            <i />
          </div>
          <div>
            <p className="browse-kicker">Your circle</p>
            <h2>Getting your chats ready</h2>
            <p>Finding your conversations and keeping things private.</p>
            <div className="wc-loading-bubbles" aria-hidden>
              <i />
              <i />
              <i />
            </div>
          </div>
        </section>
      </div>
    </PageShell>
  );
}
