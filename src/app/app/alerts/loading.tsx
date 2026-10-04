import { InboxSwitcher } from "@/components/inbox-switcher";
import { PageShell } from "@/components/site-chrome";

/** Shown at once when Alerts is tapped: the right tab is already highlighted, with a plain "Loading". */
export default function Loading() {
  return (
    <PageShell>
      <div className="inbox-unified is-alerts">
        <InboxSwitcher active="alerts" />
        <section className="inbox-alerts-panel" aria-busy="true" aria-live="polite">
          <header><p>Your private inbox</p><h1>Updates</h1></header>
          <p className="alerts-genz-hint">Loading…</p>
          <div className="app-route-loading-card" />
          <div className="app-route-loading-card" />
          <div className="app-route-loading-card" />
        </section>
      </div>
    </PageShell>
  );
}
