import { AnalyticsTabs } from "@/app/desk/analytics/analytics-tabs";

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
      {children}
    </section>
  );
}
