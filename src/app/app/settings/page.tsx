import { BackToAccount } from "@/components/back-to-account";
import { cookies } from "next/headers";
import { SettingsForm } from "@/app/app/profiles/settings-form";
import { InnerShell as PageShell } from "@/components/chrome-layout";
import { ScenePicker } from "@/components/scene-picker";
import { ensureAppUser, getAuth } from "@/lib/auth/session";
import { readProfileSettings } from "@/lib/match/profile-settings";
import { parseScene, SCENE_COOKIE } from "@/lib/ui/scenes";
import { PageHero } from "@/components/page-hero";
import { redirect } from "next/navigation";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const { supabase, user } = await getAuth();
  if (!supabase || !user) redirect("/login?next=/app/settings");
  const me = await ensureAppUser(supabase, user);
  if (!me) redirect("/login?error=account");

  const { data: profiles } = await supabase
    .from("profiles")
    .select(
      "id, status, updated_at, hide_last_seen, hide_photo_until_accept, hide_details_until_accept, contact_release_mode, notify_profile_views, notify_interest",
    )
    .eq("created_by", me.id)
    .order("updated_at", { ascending: false });
  const profile =
    profiles?.find((row) => row.id === me.active_profile_id) ??
    ((profiles?.length ?? 0) === 1 ? profiles?.[0] : undefined);
  if (!profile) redirect((profiles?.length ?? 0) > 1 ? "/?pick=1" : "/app");

  const scene = parseScene((await cookies()).get(SCENE_COOKIE)?.value);

  return (
    <PageShell><BackToAccount />
      <div className="settings-page sx-stage">
        <PageHero kicker="Account" title="Settings" sub="Look, alerts and privacy." motto={false} />
        {error === "save" ? (
          <p className="browse-flash is-warn" role="alert">
            Settings could not be saved. Please try again.
          </p>
        ) : null}
        <ScenePicker initial={scene} />
        <SettingsForm profileId={profile.id} values={readProfileSettings(profile)} canDelete={me.role !== "admin"} />
      </div>
    </PageShell>
  );
}
