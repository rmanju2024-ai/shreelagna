import Link from "next/link";
import { GoogleSignIn } from "@/app/login/google-button";
import { KalyanBanner } from "@/components/home/kalyan-banner";
import { InnerShell as PageShell } from "@/components/chrome-layout";
import { pageInner } from "@/components/site-chrome";
import { getAuth } from "@/lib/auth/session";
import { SITE_PROMISE, SITE_TAGLINE } from "@/lib/brand";
import { btnHero, btnHeroGhost } from "@/lib/ui/classes";

export const dynamic = "force-dynamic";

const welcomeMessages = [
  ["English", "Made for Indian hearts, in every language"],
  ["हिन्दी", "हर भाषा में, भारतीय दिलों के लिए"],
  ["বাংলা", "প্রতিটি ভাষায়, ভারতীয় হৃদয়ের জন্য"],
  ["తెలుగు", "ప్రతి భాషలో, భారతీయ హృదయాల కోసం"],
  ["தமிழ்", "ஒவ்வொரு மொழியிலும், இந்திய இதயங்களுக்காக"],
  ["मराठी", "प्रत्येक भाषेत, भारतीय हृदयांसाठी"],
  ["ગુજરાતી", "દરેક ભાષામાં, ભારતીય હૃદયો માટે"],
  ["ಕನ್ನಡ", "ಪ್ರತಿ ಭಾಷೆಯಲ್ಲೂ, ಭಾರತೀಯ ಹೃದಯಗಳಿಗಾಗಿ"],
  ["മലയാളം", "ഓരോ ഭാഷയിലും, ഇന്ത്യൻ ഹൃദയങ്ങൾക്കായി"],
  ["ਪੰਜਾਬੀ", "ਹਰ ਭਾਸ਼ਾ ਵਿੱਚ, ਭਾਰਤੀ ਦਿਲਾਂ ਲਈ"],
] as const;

export default async function HomePage() {
  const { user } = await getAuth();

  return (
    <PageShell bleed>
      <section className="home-split">
        <div className="home-split-art">
          <KalyanBanner intensity="hero" presentation="complete" veil={false} />
        </div>
        <div className="home-split-copy">
          <p className="home-hero-kicker">✦ MarriageConnect · Bharat</p>
          <h1 className="home-split-title font-[family-name:var(--font-display)]">{SITE_TAGLINE}</h1>
          <p className="home-split-sub">
            {user ? "Welcome back. Your next introduction is waiting." : SITE_PROMISE}
          </p>
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
          <ul className="home-split-proof" aria-label="Why members trust us">
            <li>✔ Verified profiles</li>
            <li>✔ Family-first</li>
            <li>✔ Private by default</li>
          </ul>
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

      <section className="home-values relative w-full">
        <div className={`${pageInner} home-values-intro`}>
          <p>Rooted in values. Built for today.</p>
          <h2>Tradition, with a fresh start.</h2>
        </div>
        <ul className={`${pageInner} grid gap-4 pb-10 sm:grid-cols-3`}>
          {[
            ["🪔", "Sanskar", "Respect for every family, every step."],
            ["🔒", "Vishwas", "Your story stays in trusted hands."],
            ["🤝", "Sambandh", "Real guidance when you need it."],
          ].map(([icon, title, text], index) => (
            <li key={title} className="home-value-card">
              <span className="home-value-number" aria-hidden>{icon}</span>
              <span className="home-value-count">0{index + 1}</span>
              <p className="font-[family-name:var(--font-display)] text-2xl">{title}</p>
              <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{text}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="home-steps">
        <div className={pageInner}>
          <h2 className="font-[family-name:var(--font-display)]">Three steps to a good introduction</h2>
          <ol>
            {[
              ["1", "Create your profile", "Share your story, photos and what you hope for."],
              ["2", "Discover matches", "Browse by values, community and Kundali match."],
              ["3", "Connect with care", "Send interest, then chat once both families agree."],
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
          <h2 className="font-[family-name:var(--font-display)]">Ready to begin?</h2>
          <p>Adults only. Indian families. Considered introductions.</p>
          <div className="home-welcome-buttons">
            {user ? (
              <Link href="/browse" className={btnHero}>Discover →</Link>
            ) : (
              <GoogleSignIn label="Continue with Gmail" tone="ivory" size="lg" />
            )}
            <Link href="/about" className={btnHeroGhost}>Our story</Link>
            <Link href="/contact" className={btnHeroGhost}>Write to us</Link>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
