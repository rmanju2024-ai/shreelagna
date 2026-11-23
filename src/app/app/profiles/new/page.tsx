import { InnerShell as PageShell } from "@/components/chrome-layout";
import { KalyanBanner } from "@/components/home/kalyan-banner";
import { ensureAppUser, getAuth } from "@/lib/auth/session";
import { canAddProfile } from "@/lib/profile/caps";
import { listOwnProfiles } from "@/lib/profile/own-profile";
import { loadFaithCatalog, loadFormLists } from "@/lib/profile/load-form-lists";
import { redirect } from "next/navigation";
import { FirstProfileGate, firstProfileFrom } from "@/components/home/first-profile-gate";
import { ProfileForm } from "../profile-form";
import type { ProfileFormValues } from "../profile-form-types";

export default async function NewProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; from?: string; draft?: string; step?: string; saved?: string }>;
}) {
  const { error, from, draft, step, saved } = await searchParams;
  const { supabase, user } = await getAuth();
  if (!supabase || !user) redirect("/login?next=/app/profiles/new");
  const me = await ensureAppUser(supabase, user);
  if (!me) redirect("/login?error=account");

  const listed = await listOwnProfiles(supabase, me.id);
  const draftRow = draft ? listed.find((row) => row.id === draft) : undefined;
  if (!draftRow && !canAddProfile(listed.length)) {
    redirect(listed[0]?.id ? `/app/profiles/${listed[0].id}` : "/");
  }
  let draftValues: Record<string, unknown> | undefined;
  if (draftRow) {
    const { data } = await supabase.from("profiles").select("*").eq("id", draftRow.id).maybeSingle();
    draftValues = (data as Record<string, unknown> | null) ?? undefined;
  }

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
          {listed.length === 0 ? <FirstProfileGate from={firstProfileFrom(from)} /> : null}
          {saved ? <p className="profile-wizard-saved">This step is saved. You can leave and come back.</p> : null}
          <ProfileForm
            error={error}
            values={draftValues as ProfileFormValues | undefined}
            startStep={Number(step) || 1}
            loginEmail={me.email ?? user.email ?? ""}
            religions={religions ?? []}
            communities={communities ?? []}
            lists={lists}
            another={listed.length > 0}
          />
        </div>
      </div>
    </PageShell>
  );
}
