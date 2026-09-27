import { PageShell } from "@/components/site-chrome";
import { GoogleSignIn } from "./google-button";
import { getAuth } from "@/lib/auth/session";
import { safeNextPath } from "@/lib/auth/safe-next";
import { KalyanBanner } from "@/components/home/kalyan-banner";
import { BrandMark } from "@/components/brand-mark";
import { cardClass } from "@/lib/ui/classes";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const { error, next } = await searchParams;
  const dest = safeNextPath(next);
  const { user } = await getAuth();
  if (user && !error) redirect(dest);

  return (
    <PageShell bleed atmosphere={false}>
      <div className="grid min-h-dvh flex-1 lg:grid-cols-2">
        <section className="relative min-h-[42vh] overflow-hidden lg:min-h-full">
          <KalyanBanner intensity="hero" />
          <div className="relative z-10 flex h-full flex-col justify-end px-8 py-12 lg:justify-center lg:px-14">
            <BrandMark light />
            <p className="mt-8 text-[11px] uppercase tracking-[0.28em] text-[var(--gold-soft)]">
              Members of the house
            </p>
            <h1 className="mt-3 max-w-lg font-[family-name:var(--font-display)] text-4xl leading-tight text-[#f7efe4] sm:text-5xl">
              Sign in with the Gmail you registered with.
            </h1>
          </div>
        </section>
        <section className="relative flex flex-col justify-center bg-[#f7efe4] px-6 py-14 sm:px-10 lg:px-16">
          <div className={`${cardClass} card-3d p-8`}>
            <h2 className="font-[family-name:var(--font-display)] text-2xl">Welcome back</h2>
            <div className="gold-ornament" />
            <p className="mb-6 text-sm leading-relaxed text-[var(--muted)]">
              Continue with the same Gmail. Your profile and member ID stay with
              that address. New families may also begin here in this one step.
            </p>
            {error === "network" ? (
              <p className="mb-6 rounded-md border border-red-200 bg-white px-3 py-2 text-sm text-red-800">
                Sign-in did not finish. Please try Gmail again in a moment.
              </p>
            ) : error === "config" ? (
              <p className="mb-6 rounded-md border border-red-200 bg-white px-3 py-2 text-sm text-red-800">
                Sign-in is not ready on this site yet. Please try again shortly.
              </p>
            ) : error === "google" ? (
              <p className="mb-6 rounded-md border border-red-200 bg-white px-3 py-2 text-sm text-red-800">
                Google could not be opened. Please try Continue with Gmail again.
              </p>
            ) : error ? (
              <p className="mb-6 rounded-md border border-red-200 bg-white px-3 py-2 text-sm text-red-800">
                Sign-in did not finish. Please try Gmail again.
              </p>
            ) : null}
            <GoogleSignIn label="Continue with Gmail" tone="ivory" next={dest} />
          </div>
        </section>
      </div>
    </PageShell>
  );
}
