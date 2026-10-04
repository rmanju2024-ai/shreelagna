import Link from "next/link";
import { GoogleSignIn } from "@/app/login/google-button";
import { KalyanBanner } from "@/components/home/kalyan-banner";
import { InnerShell as PageShell } from "@/components/chrome-layout";
import { pageInner } from "@/components/site-chrome";
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
    <PageShell bleed>
      <section className="home-artwork relative h-[100svh] min-h-[640px] w-full overflow-hidden lg:min-h-[780px]">
        <KalyanBanner intensity="hero" presentation="complete" veil={false} />
      </section>

      <section className="home-welcome">
        <div className={`${pageInner} home-welcome-inner`}>
          <div>
            <p className="home-hero-kicker">✦ Shree Lagna · Bharat</p>
            <h1 className="home-welcome-title font-[family-name:var(--font-display)]">
              A sacred beginning.
            </h1>
            <p className="home-welcome-sub">
              {user
                ? "Welcome back. Your next step awaits."
                : "Meet with dignity. Begin with a trusted introduction."}
            </p>
          </div>
          <div className="home-welcome-action">
            <ul className="home-hero-chips" aria-label="Shree Lagna promises">
              <li>🪔 Sanskar</li>
              <li>🤝 Saath</li>
              <li>🔒 Maryada</li>
            </ul>
            <div className="home-welcome-buttons">
              {user ? (
                <Link href="/app" className={btnHero}>
                  My profile →
                </Link>
              ) : (
                <GoogleSignIn label="Continue with Gmail" tone="ivory" size="lg" />
              )}
              <Link href="/browse" className={btnHeroGhost}>
                Discover →
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
        <div className={`${pageInner} home-values-intro`}>
          <p>Rooted in values. Built for today.</p>
          <h2>Tradition, with a fresh start.</h2>
        </div>
        <ul className={`${pageInner} grid gap-4 pb-10 sm:grid-cols-3`}>
          {[
            ["🪔", "Sanskar", "Respect for every family, every step."],
            ["🔒", "Vishwas", "Your story stays in trusted hands."],
            ["🤝", "Sambandh", "Real guidance when you need it."],
          ].map(([icon, t, d], index) => (
            <li key={t} className="home-value-card">
              <span className="home-value-number" aria-hidden>{icon}</span>
              <span className="home-value-count">0{index + 1}</span>
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
