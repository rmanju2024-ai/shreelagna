import Link from "next/link";
import { BannerGreeting } from "@/components/home/banner-greeting";
import { setActiveProfile } from "@/app/app/profiles/actions";
import { ensureAppUser, getAuth } from "@/lib/auth/session";
import { canAddProfile, MAX_PROFILES_PER_ACCOUNT } from "@/lib/profile/caps";
import { displayFirstName, profileKindLabel } from "@/lib/profile/options";
import { listOwnProfiles } from "@/lib/profile/own-profile";
import { workingProfileId } from "@/lib/profile/working-profile";
import { btnHero, btnHeroGhost } from "@/lib/ui/classes";

type Stats = { views: number; interestsIn: number; interestsOut: number; chats: number };

function emptyStats(): Stats {
  return { views: 0, interestsIn: 0, interestsOut: 0, chats: 0 };
}

export async function HomeProfilesBoard({ pick }: { pick?: boolean }) {
  const { supabase, user } = await getAuth();
  if (!supabase || !user) return null;
  const me = await ensureAppUser(supabase, user);
  if (!me) return null;

  const listed = await listOwnProfiles(supabase, me.id);
  const ids = listed.map((row) => row.id);
  const working = workingProfileId(me.active_profile_id, ids);
  const needPick = listed.length > 1 && !working;

  const stats = new Map<string, Stats>();
  for (const id of ids) stats.set(id, emptyStats());
  if (ids.length) {
    const [views, rec, sen, threads] = await Promise.all([
      supabase.from("profile_views").select("viewed_profile_id").in("viewed_profile_id", ids),
      supabase.from("interests").select("to_profile_id").in("to_profile_id", ids),
      supabase.from("interests").select("from_profile_id").in("from_profile_id", ids),
      supabase.from("threads").select("profile_a, profile_b").or(`profile_a.in.(${ids.join(",")}),profile_b.in.(${ids.join(",")})`),
    ]);
    for (const row of views.data ?? []) {
      const key = String((row as { viewed_profile_id: string }).viewed_profile_id);
      const cur = stats.get(key) ?? emptyStats();
      cur.views += 1;
      stats.set(key, cur);
    }
    for (const row of rec.data ?? []) {
      const key = String((row as { to_profile_id: string }).to_profile_id);
      const cur = stats.get(key) ?? emptyStats();
      cur.interestsIn += 1;
      stats.set(key, cur);
    }
    for (const row of sen.data ?? []) {
      const key = String((row as { from_profile_id: string }).from_profile_id);
      const cur = stats.get(key) ?? emptyStats();
      cur.interestsOut += 1;
      stats.set(key, cur);
    }
    for (const row of threads.data ?? []) {
      const a = String((row as { profile_a: string }).profile_a);
      const b = String((row as { profile_b: string }).profile_b);
      for (const key of [a, b]) {
        if (!stats.has(key)) continue;
        const cur = stats.get(key) ?? emptyStats();
        cur.chats += 1;
        stats.set(key, cur);
      }
    }
  }

  const room = canAddProfile(listed.length);

  if (!listed.length) {
    return (
      <>
        <BannerGreeting />
        <p className="home-invite-line">Create a bride or groom profile to begin.</p>
        <div className="home-invite-actions">
          <Link href="/app/profiles/new" className={btnHero}>
            Create your first profile
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <BannerGreeting />
      {listed.length === 1 ? (
        <p className="home-invite-line">
          One login can hold up to {MAX_PROFILES_PER_ACCOUNT} profiles — for twins, or a parent
          managing more than one child. Discover stays as it is until you add another.
        </p>
      ) : needPick || pick ? (
        <p className="home-invite-line home-invite-pick">
          Choose which profile Discover should use: bride or groom. Lists stay empty until you pick.
        </p>
      ) : (
        <p className="home-invite-line">
          Working as{" "}
          <b>
            {profileKindLabel(listed.find((row) => row.id === working)?.profile_type)}
            {listed.find((row) => row.id === working)?.subject_full_name
              ? ` · ${displayFirstName(listed.find((row) => row.id === working)?.subject_full_name)}`
              : ""}
          </b>
          . Switch below, then open Discover.
        </p>
      )}
      <div className="home-profile-table-wrap">
        <table className="home-profile-table">
          <caption>
            Your profiles ({listed.length} of {MAX_PROFILES_PER_ACCOUNT})
          </caption>
          <thead>
            <tr>
              <th>Profile</th>
              <th>Kind</th>
              <th>ID</th>
              <th>Views</th>
              <th>Interests in</th>
              <th>Sent</th>
              <th>Chats</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {listed.map((row) => {
              const s = stats.get(row.id) ?? emptyStats();
              const on = row.id === working;
              return (
                <tr key={row.id} className={on ? "is-working" : undefined}>
                  <td>
                    <Link href={`/app/profiles/${row.id}`}>
                      {displayFirstName(row.subject_full_name) || "Profile"}
                    </Link>
                    {row.current_city ? <span className="home-profile-city">{row.current_city}</span> : null}
                  </td>
                  <td>{profileKindLabel(row.profile_type)}</td>
                  <td>{row.member_code ?? "—"}</td>
                  <td>{s.views}</td>
                  <td>{s.interestsIn}</td>
                  <td>{s.interestsOut}</td>
                  <td>{s.chats}</td>
                  <td>
                    {on ? (
                      <span className="home-profile-on">Using</span>
                    ) : (
                      <form action={setActiveProfile}>
                        <input type="hidden" name="id" value={row.id} />
                        <input type="hidden" name="next" value="/browse" />
                        <button type="submit" className="home-profile-use">
                          Use this
                        </button>
                      </form>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="home-invite-actions">
        {listed.length === 1 ? (
          <Link href={`/app/profiles/${listed[0].id}`} className={btnHero}>
            My profile
          </Link>
        ) : working ? (
          <Link href="/browse" className={btnHero}>
            Discover for this profile
          </Link>
        ) : null}
        {room ? (
          <Link href="/app/profiles/new" className={listed.length === 1 ? btnHeroGhost : btnHero}>
            {listed.length === 1 ? "Add a second profile" : "Add another profile"}
          </Link>
        ) : (
          <p className="home-invite-line">You have reached the three-profile limit for this login.</p>
        )}
      </div>
    </>
  );
}
