import { InnerShell as PageShell } from "@/components/chrome-layout";
import { GoogleSignIn } from "./google-button";
import { getAuth } from "@/lib/auth/session";
import { safeNextPath } from "@/lib/auth/safe-next";
import { KalyanBanner } from "@/components/home/kalyan-banner";
import { SITE_TAGLINE } from "@/lib/brand";
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
    <PageShell bleed>
      <div className="login-genz grid min-h-0 flex-1 lg:grid-cols-2">
        <section className="login-genz-visual relative overflow-hidden" aria-hidden>
          <KalyanBanner intensity="hero" presentation="cover" veil />
          <p className="login-genz-tagline foil-title is-light font-[family-name:var(--font-display)]">
            {SITE_TAGLINE}
          </p>
        </section>
        <section className="login-genz-action relative flex flex-col justify-center px-5 py-8 sm:px-10 lg:px-16">
          <div className={`${cardClass} card-3d login-genz-card p-7 sm:p-8`}>
            <h1 className="font-[family-name:var(--font-display)] text-2xl sm:text-3xl">Sign in</h1>
            <p className="mb-6 mt-2 text-sm leading-relaxed text-[var(--muted)]">
              Use the Gmail you registered with.
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
