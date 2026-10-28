import { InboxSwitcherNav } from "@/components/inbox-switcher";
import { InnerShell as PageShell } from "@/components/chrome-layout";

/** Likes opens with its own tab highlighted and a plain "Loading", never the chat skeleton. */
export default function Loading() {
  return (
    <PageShell>
      <div className="sx-stage">
        <div className="inbox-unified"><InboxSwitcherNav active="likes" /></div>
        <div className="app-route-loading-card" />
        <div className="app-route-loading-card" />
      </div>
    </PageShell>
  );
}
