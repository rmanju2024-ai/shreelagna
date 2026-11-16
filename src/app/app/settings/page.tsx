import { BackToAccount } from "@/components/back-to-account";
import { cookies } from "next/headers";
import { SettingsForm } from "@/app/app/profiles/settings-form";
import { InnerShell as PageShell } from "@/components/chrome-layout";
import { ScenePicker } from "@/components/scene-picker";
import { ensureAppUser, getAuth } from "@/lib/auth/session";
import { readProfileSettings } from "@/lib/match/profile-settings";
import { displayFirstName } from "@/lib/profile/options";
import { requireWorkingProfile } from "@/lib/profile/working-profile";
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

  const working = await requireWorkingProfile(supabase, me);
  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "id, status, hide_last_seen, hide_photo_until_accept, hide_details_until_accept, contact_release_mode, notify_profile_views, notify_interest",
    )
    .eq("id", working.id)
    .eq("created_by", me.id)
    .maybeSingle();
  if (!profile) redirect("/app");

  const listed = working.listed.find((row) => row.id === working.id);
  const profileLabel =
    displayFirstName(listed?.subject_full_name ?? "This profile") +
    (listed?.member_code ? ` · ${listed.member_code}` : "");
  const canPause = profile.status === "active" || profile.status === "hidden";
  const scene = parseScene((await cookies()).get(SCENE_COOKIE)?.value);

  return (
    <PageShell>
      <BackToAccount />
      <div className="settings-page sx-stage">
        <PageHero kicker="Account" title="Settings" sub="Look, alerts and privacy for the profile in use." motto={false} />
        {error === "save" ? (
          <p className="browse-flash is-warn" role="alert">
            Settings could not be saved. Please try again.
          </p>
        ) : null}
        <ScenePicker initial={scene} />
        <SettingsForm
          profileId={profile.id}
          profileLabel={profileLabel}
          canPause={canPause}
          values={readProfileSettings(profile)}
          canDelete={me.role !== "admin"}
        />
      </div>
    </PageShell>
  );
}
