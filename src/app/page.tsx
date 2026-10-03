import Link from "next/link";
import { GoogleSignIn } from "@/app/login/google-button";
import { KalyanBanner } from "@/components/home/kalyan-banner";
import { PageShell, pageInner } from "@/components/site-chrome";
import { getAuth } from "@/lib/auth/session";
import { btnHero, btnHeroGhost } from "@/lib/ui/classes";

export const dynamic = "force-dynamic";

const welcomeMessages = [
  ["English", "Welcome to your next chapter"],
  ["हिन्दी", "आपका स्वागत है"],
  ["বাংলা", "স্বাগতম"],
  ["తెలుగు", "స్వాగతం"],
  ["தமிழ்", "வரவேற்கிறோம்"],
  ["मराठी", "स्वागत आहे"],
  ["ગુજરાતી", "સ્વાગત છે"],
  ["ಕನ್ನಡ", "ಸ್ವಾಗತ"],
  ["മലയാളം", "സ്വാഗതം"],
  ["ਪੰਜਾਬੀ", "ਜੀ ਆਇਆਂ ਨੂੰ"],
] as const;

export default async function HomePage() {
  const { user } = await getAuth();

  return (
    <PageShell bleed overlay>
      <section className="relative h-[100svh] min-h-[640px] w-full overflow-hidden lg:min-h-[780px]">
        <KalyanBanner intensity="hero" presentation="complete" />
        <div
          className={`${pageInner} relative z-10 flex h-full min-h-[640px] flex-col justify-end pb-12 pt-36 lg:min-h-[780px] lg:pb-16 lg:pt-44`}
        >
          <div className="home-hero-copy max-w-2xl">
            <p className="home-hero-kicker">✦ Private introductions · India</p>
            <h1 className="home-hero-title mt-4 font-[family-name:var(--font-display)]">
              Families, gathered with grace.
            </h1>
            <p className="home-hero-sub mt-5 max-w-xl">
              {user
                ? "Welcome back. Continue your profile, or search with care."
                : "A quiet house for Indian families. Sign in with Gmail to begin."}
            </p>
            <ul className="home-hero-chips" aria-label="Shree Lagna promises">
              <li>🔒 Private by default</li>
              <li>✨ Family-first</li>
              <li>🇮🇳 Made for India</li>
            </ul>
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

      <section className="home-language-banner" aria-label="Welcome in Indian languages">
        <div className="home-language-viewport">
          <div className="home-language-track">
            {[...welcomeMessages, ...welcomeMessages].map(([language, message], index) => (
              <p key={`${language}-${index}`} aria-hidden={index >= welcomeMessages.length}>
                <b>{language}</b>
                <span>{message}</span>
                <i aria-hidden>✦</i>
              </p>
            ))}
          </div>
        </div>
      </section>

      <section className="home-values relative w-full border-y border-[var(--stroke)]">
        <ul className={`${pageInner} grid gap-4 py-8 sm:grid-cols-3`}>
          {[
            ["01", "Dignity", "Every bride and groom, presented with care."],
            ["02", "Discretion", "Private details stay in the house."],
            ["03", "A real person", "Write to us. Someone will read it."],
          ].map(([number, t, d]) => (
            <li key={t} className="home-value-card">
              <span className="home-value-number" aria-hidden>{number}</span>
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
