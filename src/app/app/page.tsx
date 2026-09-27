import { PageShell } from "@/components/site-chrome";
import { ensureAppUser, getAuth } from "@/lib/auth/session";
import { btnPrimary, cardClass } from "@/lib/ui/classes";
import { redirect } from "next/navigation";
import Link from "next/link";

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

  const active = profiles?.find((p) => p.id === me.active_profile_id) ?? profiles?.[0];
  if (active) {
    if (me.active_profile_id !== active.id) {
      await supabase.from("app_users").update({ active_profile_id: active.id }).eq("id", me.id);
    }
    redirect(`/app/profiles/${active.id}`);
  }

  return (
    <PageShell>
      <p className="text-xs uppercase tracking-[0.2em] text-[var(--accent)]">
        Signed in · {user.email}
      </p>
      <h1 className="mt-2 font-[family-name:var(--font-display)] text-4xl sm:text-5xl">
        Your profile
      </h1>
      <div className="gold-ornament" />
      <p className="mt-3 max-w-2xl text-[var(--muted)]">
        This Gmail does not have a profile yet. One profile belongs to this
        email.
      </p>
      <div className={`${cardClass} mt-8 max-w-xl`}>
        <p className="text-[var(--muted)]">
          Register a bride or groom to begin browsing families.
        </p>
        <Link href="/app/profiles/new" className={`${btnPrimary} mt-4`}>
          Create your profile
        </Link>
      </div>
    </PageShell>
  );
}
