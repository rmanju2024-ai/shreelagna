import { Suspense } from "react";
import { ChatSidebar, ChatSidebarSkeleton } from "@/app/app/chat/chat-sidebar";
import { ChatFrame } from "@/app/app/chat/chat-thread-list";
import { InboxSwitcher } from "@/components/inbox-switcher";
import { InnerShell as PageShell } from "@/components/chrome-layout";

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  return (
    <PageShell>
      <div className="inbox-unified">
        <InboxSwitcher active="chats" />
        <ChatFrame>
          <Suspense fallback={<ChatSidebarSkeleton />}>
            <ChatSidebar />
          </Suspense>
          {children}
        </ChatFrame>
      </div>
    </PageShell>
  );
}
