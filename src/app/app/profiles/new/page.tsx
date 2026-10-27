import { InnerShell as PageShell } from "@/components/chrome-layout";
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
      <div className="profile-create-shell atelier grid items-start gap-10 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.35fr)]">
        <aside className="profile-create-intro relative overflow-hidden rounded-[1.8rem] border border-[var(--gold)]/35 shadow-[0_28px_50px_rgba(47,22,14,0.18)] lg:sticky lg:top-32">
          <h1 className="visually-hidden">Register a profile</h1>
          <div className="profile-create-stage">
            <KalyanBanner intensity="hero" />
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
