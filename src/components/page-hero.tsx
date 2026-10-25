import { BrandMotto } from "@/components/brand-motto";

/** Shared page banner (same look as Discover). */
export function PageHero({
  kicker,
  title,
  sub,
  stat,
  motto = true,
}: {
  kicker?: string;
  title: string;
  sub?: string;
  stat?: { value: string | number; label: string };
  motto?: boolean;
}) {
  return (
    <header className="sx-hero">
      <div className="sx-hero-copy">
        {kicker ? <p className="sx-eyebrow">{kicker}</p> : null}
        <h1 className="foil-title">{title}</h1>
        {motto ? <BrandMotto /> : null}
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
