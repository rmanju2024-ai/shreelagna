import { cookies } from "next/headers";
import { SettingsForm } from "@/app/app/profiles/settings-form";
import { PageShell } from "@/components/site-chrome";
import { ScenePicker } from "@/components/scene-picker";
import { ensureAppUser, getAuth } from "@/lib/auth/session";
import { readProfileSettings } from "@/lib/match/profile-settings";
import { parseScene, SCENE_COOKIE } from "@/lib/ui/scenes";
import { redirect } from "next/navigation";

export default async function SettingsPage() {
  const { supabase, user } = await getAuth();
  if (!supabase || !user) redirect("/login?next=/app/settings");
  const me = await ensureAppUser(supabase, user);
  if (!me) redirect("/login?error=account");

  const { data: profiles } = await supabase
    .from("profiles")
    .select("*")
    .eq("created_by", me.id)
    .order("updated_at", { ascending: false });
  const profile = profiles?.find((row) => row.id === me.active_profile_id) ?? profiles?.[0];
  if (!profile) redirect("/app");

  let { data: account, error: accountError } = await supabase
    .from("app_users")
    .select("notify_match_email, notify_whatsapp")
    .eq("id", me.id)
    .maybeSingle();
  if (accountError) {
    const retry = await supabase
      .from("app_users")
      .select("notify_match_email")
      .eq("id", me.id)
      .maybeSingle();
    account = retry.data;
  }

  const scene = parseScene((await cookies()).get(SCENE_COOKIE)?.value);

  return (
    <PageShell>
      <div className="settings-page">
        <ScenePicker initial={scene} />
        <SettingsForm profileId={profile.id} values={readProfileSettings(profile, account)} />
      </div>
    </PageShell>
  );
}
