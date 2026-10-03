import Link from "next/link";
import { PageHero } from "@/components/page-hero";
import { PageShell } from "@/components/site-chrome";

type Section = { title: string; body: string[] };

export function LegalPage({
  kicker,
  title,
  summary,
  sections,
}: {
  kicker: string;
  title: string;
  summary: string;
  sections: Section[];
}) {
  return (
    <PageShell>
      <article className="sx-stage public-stage legal-page">
        <PageHero kicker={kicker} title={title} sub={summary} />
        <p className="legal-effective">Effective: 3 October 2026 · For help, use our <Link href="/contact">Support Centre</Link>.</p>
        <div className="legal-sections">
          {sections.map((section) => (
            <section key={section.title} className="legal-section">
              <h2>{section.title}</h2>
              {section.body.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            </section>
          ))}
        </div>
      </article>
    </PageShell>
  );
}
