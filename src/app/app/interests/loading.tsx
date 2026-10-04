import { InboxSwitcher } from "@/components/inbox-switcher";
import { PageShell } from "@/components/site-chrome";

/** Likes opens with its own tab highlighted and a plain "Loading", never the chat skeleton. */
export default function Loading() {
  return (
    <PageShell>
      <div className="sx-stage">
        <div className="inbox-unified"><InboxSwitcher active="likes" /></div>
        <p className="alerts-genz-hint" aria-live="polite">Loading…</p>
        <div className="app-route-loading-card" />
        <div className="app-route-loading-card" />
      </div>
    </PageShell>
  );
}
