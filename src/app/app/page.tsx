import { BackToAccount } from "@/components/back-to-account";
import { InnerShell as PageShell } from "@/components/chrome-layout";
import { ensureAppUser, getAuth } from "@/lib/auth/session";
import { btnPrimary, cardClass } from "@/lib/ui/classes";
import { redirect } from "next/navigation";
import Link from "next/link";
import { after } from "next/server";
import { PageHero } from "@/components/page-hero";

export default async function AppHome() {
  const { supabase, user } = await getAuth();
  if (!supabase || !user) redirect("/login?next=/app");
  const me = await ensureAppUser(supabase, user);
  if (!me) redirect("/login?error=account");

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id")
    .eq("created_by", me.id)
    .order("updated_at", { ascending: false });

  const ids = (profiles ?? []).map((p) => p.id);
  if (ids.length > 1) {
    const chosen = me.active_profile_id && ids.includes(me.active_profile_id) ? me.active_profile_id : null;
    if (!chosen) redirect("/?pick=1");
    redirect(`/app/profiles/${chosen}`);
  }
  const only = ids[0];
  if (only) {
    if (me.active_profile_id !== only) {
      after(async () => {
        await supabase.from("app_users").update({ active_profile_id: only }).eq("id", me.id);
      });
    }
    redirect(`/app/profiles/${only}`);
  }

  return (
    <PageShell><BackToAccount />
      <div className="sx-stage public-stage">
      <PageHero
        kicker="You’re signed in"
        title="Ready to start your story?"
        sub={`Create the profile connected to ${user.email}. You can save a draft and finish it anytime.`}
        motto={false}
      />
      <div className={`${cardClass} gz-empty-state`}>
        <span className="gz-empty-icon" aria-hidden>✨</span>
        <div>
        <h2>Create your first profile</h2>
        <p>Register a bride or groom, then discover compatible families.</p>
        <Link href="/app/profiles/new" className={`${btnPrimary} mt-4`}>
          Create your profile
        </Link>
        </div>
      </div>
      </div>
    </PageShell>
  );
}
