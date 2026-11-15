import { redirect } from "next/navigation";
import { threadIdWith } from "@/app/app/chat/chat-sidebar";
import { LiveRefresh } from "@/components/live-refresh";

export default async function ChatListPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; with?: string }>;
}) {
  const { tab, with: withId } = await searchParams;
  if (tab === "alerts") redirect("/app/alerts");
  if (withId) {
    const match = await threadIdWith(withId);
    if (match) redirect(`/app/chat/${match}`);
  }
  return (
    <>
      <LiveRefresh table="messages" />
      <section className="wc-welcome" aria-label="No chat selected">
        <div>
          <span className="gz-emoji" aria-hidden>
            💬
          </span>
          <h2>Your conversations</h2>
          <p>Pick a match on the left to start chatting.</p>
        </div>
      </section>
    </>
  );
}
