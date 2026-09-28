import { Suspense } from "react";
import { AnalyticsTabs } from "@/app/desk/analytics/analytics-tabs";
import { DeskPaneFallback } from "@/app/desk/desk-fallback";

export default function AnalyticsLayout({ children }: { children: React.ReactNode }) {
  return (
    <section className="desk-panel">
      <header className="desk-panel-head">
        <div>
          <p className="browse-kicker">Analytics</p>
          <h2>House pulse</h2>
        </div>
      </header>
      <AnalyticsTabs />
      <Suspense fallback={<DeskPaneFallback />}>{children}</Suspense>
    </section>
  );
}
