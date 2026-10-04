import { AlertsFeed } from "@/app/app/alerts/alerts-feed";
import { InboxSwitcher } from "@/components/inbox-switcher";
import { InnerShell as PageShell } from "@/components/chrome-layout";

export default function AlertsPage() {
  return (
    <PageShell>
      <div className="inbox-unified is-alerts">
        <InboxSwitcher active="alerts" />
        <section className="inbox-alerts-panel" aria-label="Alerts">
          <header><p>Your private inbox</p><h1>Updates</h1></header>
          <AlertsFeed />
        </section>
      </div>
    </PageShell>
  );
}
