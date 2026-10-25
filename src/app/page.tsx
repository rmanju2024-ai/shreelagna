import Link from "next/link";
import { GoogleSignIn } from "@/app/login/google-button";
import { KalyanBanner } from "@/components/home/kalyan-banner";
import { InnerShell as PageShell } from "@/components/chrome-layout";
import { pageInner } from "@/components/site-chrome";
import { getAuth } from "@/lib/auth/session";
import { SITE_PROMISE } from "@/lib/brand";
import { btnHero, btnHeroGhost } from "@/lib/ui/classes";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const { user } = await getAuth();

  return (
    <PageShell bleed>
      <section className="home-split">
        <div className="home-split-art">
          <KalyanBanner intensity="hero" presentation="complete" veil={false} />
        </div>
        <div className="home-split-copy">
          <p className="home-hero-kicker">Shubh vivah</p>
          <h1 className="home-split-title font-[family-name:var(--font-display)]">
            Come home to a blessed yes.
          </h1>
          <p className="home-split-sub">
            {user ? "Your next introduction is waiting." : SITE_PROMISE}
          </p>
          <div className="home-welcome-buttons">
            {user ? (
              <Link href="/app" className={btnHero}>
                My profile
              </Link>
            ) : (
              <GoogleSignIn label="Continue with Gmail" tone="ivory" size="lg" />
            )}
            <Link href="/browse" className={btnHeroGhost}>
              Discover
            </Link>
          </div>
        </div>
      </section>

      <section className="home-values relative w-full">
        <div className={`${pageInner} home-values-intro`}>
          <p>The house</p>
          <h2 className="font-[family-name:var(--font-display)]">Sanskar, vishwas, sambandh.</h2>
        </div>
        <ul className={`${pageInner} home-value-row`}>
          {[
            ["01", "Sanskar", "The warmth of a well-raised home."],
            ["02", "Vishwas", "Your story stays in kind hands."],
            ["03", "Sambandh", "A bond both families can bless."],
          ].map(([n, title, text]) => (
            <li key={title} className="home-value-card">
              <span className="home-value-count">{n}</span>
              <p className="font-[family-name:var(--font-display)] text-2xl">{title}</p>
              <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{text}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="home-steps">
        <div className={pageInner}>
          <h2 className="font-[family-name:var(--font-display)]">Begin in three steps</h2>
          <ol>
            {[
              ["01", "Share your ghar", "A few photos, a little of your story."],
              ["02", "Find a match", "Values, community, and Kundali."],
              ["03", "Send a rishta", "Interest first. Chat when both say haan."],
            ].map(([n, title, text]) => (
              <li key={n}>
                <b>{n}</b>
                <h3>{title}</h3>
                <p>{text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="home-final">
        <div className={pageInner}>
          <h2 className="font-[family-name:var(--font-display)]">Shubh aarambh</h2>
          <p>When the heart feels ready.</p>
          <div className="home-welcome-buttons">
            {user ? (
              <Link href="/browse" className={btnHeroGhost}>Discover</Link>
            ) : (
              <GoogleSignIn label="Continue with Gmail" tone="ivory" size="lg" />
            )}
            <Link href="/about" className={btnHeroGhost}>Our story</Link>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
