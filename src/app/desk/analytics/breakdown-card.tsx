import type { CountRow } from "@/lib/desk/breakdown";
import { cardClass } from "@/lib/ui/classes";

function categoryId(title: string) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export function BreakdownCard({ title, rows }: { title: string; rows: CountRow[] }) {
  const max = Math.max(1, ...rows.map((row) => row.count));
  return (
    <section className={`${cardClass} card-3d desk-break-card`} data-category={categoryId(title)}>
      <p className="browse-kicker">{title}</p>
      {rows.length ? (
        <ul className="desk-break-list">
          {rows.map((row) => (
            <li key={row.label}>
              <div className="desk-break-row">
                <span>{row.label}</span>
                <b>{row.count}</b>
              </div>
              <span className="desk-break-bar" style={{ width: `${Math.max(8, (row.count / max) * 100)}%` }} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="desk-empty">Nothing to count yet.</p>
      )}
    </section>
  );
}

export function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className={`${cardClass} card-3d desk-stat`}>
      <b>{value}</b>
      <span>{label}</span>
    </div>
  );
}

export function PulseGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="desk-pulse-group" data-category={categoryId(title)}>
      <p className="browse-kicker">{title}</p>
      <div className="desk-stats">{children}</div>
    </section>
  );
}
