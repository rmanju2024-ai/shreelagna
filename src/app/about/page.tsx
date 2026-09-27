import Link from "next/link";
import type { Metadata } from "next";
import { GoogleSignIn } from "@/app/login/google-button";
import { PageShell } from "@/components/site-chrome";
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
      <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--gold)]">About us</p>
      <h1 className="mt-4 max-w-3xl font-[family-name:var(--font-display)] text-5xl leading-tight sm:text-6xl">
        A private house for Indian families who expect discretion.
      </h1>
      <p className="mt-6 max-w-2xl text-lg leading-relaxed text-[var(--muted)]">
        Shree Lagna is a family-run matrimonial house. Members sign in with
        Gmail and present a bride or a groom — for yourself, or for someone you
        hold dear. We keep every introduction considered.
      </p>

      <div className="mt-14 grid gap-6 md:grid-cols-3">
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

      <div className="gold-ornament" />
      <blockquote className="mt-10 max-w-3xl border-l-2 border-[var(--gold)] pl-6 font-[family-name:var(--font-display)] text-2xl leading-snug sm:text-3xl">
        Search with ease. Speak when both families are ready.
      </blockquote>

      <div className="mt-12">
        {user ? (
          <Link href="/app" className={btnPrimary}>
            My profile
          </Link>
        ) : (
            <GoogleSignIn label="Continue with Gmail" tone="ivory" />
        )}
      </div>
    </PageShell>
  );
}
