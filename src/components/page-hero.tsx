/** Shared page banner (same look as Discover). */
export function PageHero({
  kicker,
  title,
  sub,
  stat,
}: {
  kicker?: string;
  title: string;
  sub?: string;
  stat?: { value: string | number; label: string };
}) {
  return (
    <header className="sx-hero">
      <div>
        {kicker ? <p className="sx-eyebrow">{kicker}</p> : null}
        <h1>{title}</h1>
        {sub ? <p className="sx-hero-sub">{sub}</p> : null}
      </div>
      {stat ? (
        <p className="sx-hero-count">
          <b>{stat.value}</b>
          <span>{stat.label}</span>
        </p>
      ) : null}
    </header>
  );
}
