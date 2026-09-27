import { PageShell } from "@/components/site-chrome";
import { KalyanBanner } from "@/components/home/kalyan-banner";
import { ensureAppUser, getAuth } from "@/lib/auth/session";
import { findOwnProfile } from "@/lib/profile/own-profile";
import { loadFaithCatalog, loadFormLists } from "@/lib/profile/load-form-lists";
import { redirect } from "next/navigation";
import { ProfileForm } from "../profile-form";

export default async function NewProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const { supabase, user } = await getAuth();
  if (!supabase || !user) redirect("/login?next=/app/profiles/new");
  const me = await ensureAppUser(supabase, user);
  if (!me) redirect("/login?error=account");

  const mine = await findOwnProfile(supabase, me.id);
  if (mine) redirect(`/app/profiles/${mine.id}`);

  const [{ religions, communities }, lists] = await Promise.all([loadFaithCatalog(), loadFormLists()]);

  return (
    <PageShell>
      <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.35fr)]">
        <aside className="relative overflow-hidden rounded-[1.8rem] border border-[var(--gold)]/35 shadow-[0_28px_50px_rgba(47,22,14,0.18)] lg:sticky lg:top-32">
          <div className="relative min-h-[280px] lg:min-h-[520px]">
            <KalyanBanner intensity="hero" />
            <div className="relative z-10 flex h-full min-h-[280px] flex-col justify-end p-8 lg:min-h-[520px]">
              <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--gold-soft)]">
                Register a profile
              </p>
              <h1 className="mt-3 font-[family-name:var(--font-display)] text-4xl leading-tight text-[#f7efe4] sm:text-5xl">
                Present a bride or groom with grace.
              </h1>
              <p className="mt-4 max-w-md text-sm leading-relaxed text-[#f3e6d4]/88">
                Choose whether you write for yourself, a parent, a sister, a
                brother, or as guardian — then complete their profile.
              </p>
            </div>
          </div>
        </aside>
        <div>
          <ProfileForm
            error={error}
            loginEmail={me.email ?? user.email ?? ""}
            religions={religions ?? []}
            communities={communities ?? []}
            lists={lists}
          />
        </div>
      </div>
    </PageShell>
  );
}
