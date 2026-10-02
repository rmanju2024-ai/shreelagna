import Link from "next/link";
import { GoogleSignIn } from "@/app/login/google-button";
import { KalyanBanner } from "@/components/home/kalyan-banner";
import { PageShell, pageInner } from "@/components/site-chrome";
import { getAuth } from "@/lib/auth/session";
import { btnHero, btnHeroGhost } from "@/lib/ui/classes";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const { user } = await getAuth();

  return (
    <PageShell bleed overlay>
      <section className="relative h-[100svh] min-h-[640px] w-full overflow-hidden lg:min-h-[780px]">
        <KalyanBanner intensity="hero" />
        <div
          className={`${pageInner} relative z-10 flex h-full min-h-[640px] flex-col justify-end pb-12 pt-36 lg:min-h-[780px] lg:pb-16 lg:pt-44`}
        >
          <div className="max-w-2xl">
            <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--gold-soft)]">
              Private introductions · India
            </p>
            <h1 className="mt-4 font-[family-name:var(--font-display)] text-5xl leading-[1.08] text-[#f7efe4] sm:text-6xl lg:text-7xl">
              Families, gathered with grace.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-[#f3e6d4]/90 sm:text-lg">
              {user
                ? "Welcome back. Continue your profile, or search with care."
                : "A quiet house for Indian families. Sign in with Gmail to begin."}
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              {user ? (
                <Link href="/app" className={btnHero}>
                  My profile
                </Link>
              ) : (
                <GoogleSignIn label="Continue with Gmail" tone="ivory" size="lg" />
              )}
              <Link href="/browse" className={btnHeroGhost}>
                Search matches
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="home-values relative w-full border-y border-[var(--stroke)]">
        <ul className={`${pageInner} grid gap-4 py-8 sm:grid-cols-3`}>
          {[
            ["Dignity", "Every bride and groom, presented with care."],
            ["Discretion", "Private details stay in the house."],
            ["A person", "Write to us. Someone will read it."],
          ].map(([t, d]) => (
            <li key={t} className="home-value-card">
              <span aria-hidden>✦</span>
              <p className="font-[family-name:var(--font-display)] text-2xl">{t}</p>
              <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{d}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className={`${pageInner} flex w-full flex-wrap items-baseline justify-between gap-4 py-12`}>
        <p className="max-w-xl text-sm leading-relaxed text-[var(--muted)]">
          Adults only. Indian families. Considered introductions.
        </p>
        <p className="flex flex-wrap gap-5 text-sm tracking-wide text-[var(--accent)]">
          <Link href="/about">Our story →</Link>
          <Link href="/contact">Write to us →</Link>
        </p>
      </section>
    </PageShell>
  );
}
