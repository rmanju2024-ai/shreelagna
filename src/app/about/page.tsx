import Link from "next/link";
import type { Metadata } from "next";
import { GoogleSignIn } from "@/app/login/google-button";
import { InnerShell as PageShell } from "@/components/chrome-layout";
import { PageHero } from "@/components/page-hero";
import { getAuth } from "@/lib/auth/session";
import { btnPrimary, cardClass } from "@/lib/ui/classes";

export const metadata: Metadata = {
  title: "About us",
  description: "The house behind Shree Lagna Matrimony — family-operated, Indian, private.",
};

export default async function AboutPage() {
  const { user } = await getAuth();

  return (
    <PageShell>
      <div className="sx-stage public-stage">
        <PageHero
          kicker="Our story"
          title="A private house for meaningful matches."
          sub="Family-run, proudly Indian, and built for introductions that feel human—not transactional."
        />

      <div className="public-card-grid">
        {[
          [
            "Who we serve",
            "Families in every state and union territory of India.",
          ],
          [
            "How you begin",
            "A Gmail sign-in. Members return to their profile. Family may write on behalf of the bride or groom.",
          ],
          [
            "How we keep faith",
            "For adults only. Private details stay private. Community, if shared, is treated with care.",
          ],
        ].map(([t, d]) => (
          <article key={t} className={cardClass}>
            <h2 className="font-[family-name:var(--font-display)] text-2xl">{t}</h2>
            <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">{d}</p>
          </article>
        ))}
      </div>

      <blockquote className="public-quote">
        Search with ease. Speak when both families are ready.
      </blockquote>

      <div className="public-cta">
        {user ? (
          <Link href="/app" className={btnPrimary}>
            My profile
          </Link>
        ) : (
            <GoogleSignIn label="Continue with Gmail" tone="ivory" />
        )}
      </div>
      </div>
    </PageShell>
  );
}
