import { unblockProfile } from "@/app/app/safety/actions";
import { SafetyFlash } from "@/app/browse/safety-flash";
import { BackToAccount } from "@/components/back-to-account";
import { InnerShell as PageShell } from "@/components/chrome-layout";
import { ensureAppUser, getAuth } from "@/lib/auth/session";
import { publicMediaUrl } from "@/lib/match/inbox-card";
import { displayFirstName } from "@/lib/profile/options";
import { createServiceClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { profileOpenHref } from "@/lib/ui/dismiss";

export default async function BlockedProfilesPage({ searchParams }: { searchParams: Promise<{ safety?: string }> }) {
  const { safety } = await searchParams;
  const { supabase, user } = await getAuth();
  if (!supabase || !user) redirect("/login?next=/app/blocked");
  const me = await ensureAppUser(supabase, user);
  if (!me?.active_profile_id) redirect("/app");
  const db = createServiceClient() ?? supabase;
  const { data: blocks } = await db
    .from("member_blocks")
    .select("blocked_profile_id, created_at")
    .eq("blocker_profile_id", me.active_profile_id)
    .order("created_at", { ascending: false });
  const ids = (blocks ?? []).map((row) => row.blocked_profile_id as string);
  const [{ data: profiles }, { data: photos }] = ids.length
    ? await Promise.all([
        db.from("profiles").select("id, subject_full_name, current_city, current_state").in("id", ids),
        db.from("media").select("profile_id, storage_path, is_primary").in("profile_id", ids).eq("kind", "photo").order("created_at"),
      ])
    : [{ data: [] }, { data: [] }];
  // A block disappears with its profile, so only profiles that still exist are listed.
  const byId = new Map((profiles ?? []).map((row) => [row.id as string, row]));
  const photoOf = new Map<string, string>();
  for (const row of photos ?? []) {
    const key = row.profile_id as string;
    if (!photoOf.has(key) || row.is_primary) photoOf.set(key, row.storage_path as string);
  }
  const rows = ids.filter((id) => byId.has(id));

  return (
    <PageShell>
      <BackToAccount />
      <main className="sx-stage">
        <header className="page-head-panel">
          <p className="browse-kicker">Trust &amp; safety</p>
          <h1>Blocked profiles</h1>
          <p className="set-lead">Blocked members cannot see you and you cannot see them. Only you can unblock them.</p>
        </header>
        <SafetyFlash code={safety} />
        {rows.length ? (
          <ul className="list-cards">
            {rows.map((id) => {
              const p = byId.get(id)!;
              const photo = publicMediaUrl(photoOf.get(id));
              const name = displayFirstName(String(p.subject_full_name ?? "Member"));
              return (
                <li key={id} className="list-card">
                  <Link href={profileOpenHref(id, "blocked")} className="list-card-main">
                    <span className="list-card-photo">
                      {photo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={photo} alt="" />
                      ) : (
                        <b>{name.slice(0, 1)}</b>
                      )}
                    </span>
                    <span className="list-card-copy">
                      <strong>{name}</strong>
                      <small>{[p.current_city, p.current_state].filter(Boolean).join(", ") || "India"}</small>
                    </span>
                  </Link>
                  <form action={unblockProfile}>
                    <input type="hidden" name="profile_id" value={id} />
                    <input type="hidden" name="return_to" value="/app/blocked" />
                    <button type="submit" className="list-card-btn">Unblock</button>
                  </form>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="gz-state-card">You have not blocked anyone.</p>
        )}
      </main>
    </PageShell>
  );
}
