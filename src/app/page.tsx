import Link from "next/link";
import { GoogleSignIn } from "@/app/login/google-button";
import { KalyanBanner } from "@/components/home/kalyan-banner";
import { InnerShell as PageShell } from "@/components/chrome-layout";
import { pageInner } from "@/components/site-chrome";
import { getAuth } from "@/lib/auth/session";
import { BrandMotto } from "@/components/brand-motto";
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
          <div className="home-invite">
            <BrandMotto as="h1" />
            <p className="home-invite-line">
              {user ? "Welcome back. Your next match is waiting." : SITE_PROMISE}
            </p>
            <div className="home-invite-actions">
              {user ? (
                <Link href="/app" className={btnHero}>
                  My profile
                </Link>
              ) : (
                <GoogleSignIn label="Continue with Gmail" tone="ivory" />
              )}
              <Link href="/browse" className="home-invite-discover">
                Discover
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="home-values relative w-full">
        <div className={`${pageInner} home-values-intro`}>
          <p>The house</p>
          <h2 className="font-[family-name:var(--font-display)]">What we keep.</h2>
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
              ["01", "Share your story", "A few photos, and a little about you."],
              ["02", "Find a match", "Values, community, and Kundali."],
              ["03", "Send interest", "Reach out first. Chat when both agree."],
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
          <h2 className="font-[family-name:var(--font-display)]">Begin when you are ready</h2>
          <p>A simple, careful start.</p>
          <div className="home-welcome-buttons">
            <Link href="/about" className={btnHeroGhost}>Our story</Link>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
