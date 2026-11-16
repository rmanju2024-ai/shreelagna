import Link from "next/link";
import { BannerGreeting } from "@/components/home/banner-greeting";
import { setActiveProfile } from "@/app/app/profiles/actions";
import { ensureAppUser, getAuth } from "@/lib/auth/session";
import { publicMediaUrl } from "@/lib/match/inbox-card";
import { resolveMembership, type Membership, type PaidRow } from "@/lib/membership/access";
import { canAddProfile, MAX_PROFILES_PER_ACCOUNT } from "@/lib/profile/caps";
import { displayFirstName, profileKindLabel } from "@/lib/profile/options";
import { listOwnProfiles } from "@/lib/profile/own-profile";
import { workingProfileId } from "@/lib/profile/working-profile";
import { formatIstDate } from "@/lib/time/ist";
import { createServiceClient } from "@/lib/supabase/server";
import { btnHero, btnHeroGhost, btnGhost, btnPrimary } from "@/lib/ui/classes";

type Stats = { views: number; interestsIn: number; interestsOut: number; chats: number };

function emptyStats(): Stats {
  return { views: 0, interestsIn: 0, interestsOut: 0, chats: 0 };
}

function planLine(access: Membership) {
  const name = access.label.replace(/ plan$/i, "");
  if (!access.live) {
    return { name: name || "No plan", expiry: "Expired — renew to search" };
  }
  if (!access.until) {
    return { name, expiry: "No expiry" };
  }
  const days = access.daysLeft === 1 ? "1 day left" : `${access.daysLeft} days left`;
  return { name, expiry: `Until ${formatIstDate(access.until)} · ${days}` };
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
  const room = canAddProfile(listed.length);

  if (!listed.length) {
    return (
      <div className="home-family">
        <BannerGreeting asMember />
        <div className="home-invite-actions home-family-cta">
          <Link href="/app/profiles/new" className={btnHero}>
            Create your first profile
          </Link>
        </div>
      </div>
    );
  }

  if (listed.length === 1) {
    const only = listed[0];
    return (
      <div className="home-family">
        <BannerGreeting asMember />
        <div className="home-invite-actions home-family-cta">
          <Link href={`/app/profiles/${only.id}`} className={btnHero}>
            Open profile
          </Link>
          <Link href="/browse" className={btnHeroGhost}>
            Find a match
          </Link>
          {room ? (
            <Link href="/app/profiles/new" className={btnGhost}>
              Add another
            </Link>
          ) : null}
        </div>
      </div>
    );
  }

  const stats = new Map<string, Stats>();
  for (const id of ids) stats.set(id, emptyStats());
  const db = createServiceClient() ?? supabase;
  const [views, rec, sen, threads, photos, paidRows] = await Promise.all([
    supabase.from("profile_views").select("viewed_profile_id").in("viewed_profile_id", ids),
    supabase.from("interests").select("to_profile_id").in("to_profile_id", ids),
    supabase.from("interests").select("from_profile_id").in("from_profile_id", ids),
    supabase.from("threads").select("profile_a, profile_b").or(`profile_a.in.(${ids.join(",")}),profile_b.in.(${ids.join(",")})`),
    db.from("media").select("profile_id, storage_path, is_primary").in("profile_id", ids).eq("kind", "photo").order("created_at"),
    db.from("memberships").select("profile_id, plan_code, status, starts_at, ends_at").eq("user_id", me.id).eq("status", "active"),
  ]);
  const paidByProfile = new Map<string, PaidRow>();
  for (const row of paidRows.data ?? []) {
    const pid = String((row as { profile_id?: string | null }).profile_id ?? "");
    if (pid) paidByProfile.set(pid, row as PaidRow);
  }
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
  const photoOf = new Map<string, string>();
  for (const row of photos.data ?? []) {
    const id = String((row as { profile_id: string }).profile_id);
    const path = (row as { storage_path?: string | null; is_primary?: boolean }).storage_path;
    if (!path) continue;
    if ((row as { is_primary?: boolean }).is_primary || !photoOf.has(id)) photoOf.set(id, path);
  }
  return (
    <div className="home-family">
      <BannerGreeting asMember />
      {needPick || pick ? (
        <p className="home-invite-line home-invite-pick">Choose a bride or groom</p>
      ) : null}
      <ul className="home-family-grid">
        {listed.map((row) => {
          const s = stats.get(row.id) ?? emptyStats();
          const on = row.id === working;
          const bride = row.profile_type !== "vara";
          const photo = publicMediaUrl(photoOf.get(row.id));
          const name = displayFirstName(row.subject_full_name ?? "") || "Profile";
          const paid = paidByProfile.get(row.id) ?? null;
          const plan = planLine(
            resolveMembership({
              role: me.role,
              welcomeStartedAt: row.created_at,
              welcomeDays: me.welcome_days,
              paid,
            }),
          );
          return (
            <li key={row.id} className={`home-family-card${on ? " is-on" : ""}${bride ? " is-bride" : " is-groom"}`}>
              <div className="home-family-pic">
                {photo ? (
                  <img src={photo} alt={name} width={56} height={56} />
                ) : (
                  <span aria-hidden>{name.slice(0, 1)}</span>
                )}
              </div>
              <div className="home-family-meta">
                <span className={`home-profile-kind is-${bride ? "bride" : "groom"}`}>
                  {profileKindLabel(row.profile_type)}
                </span>
                <Link href={`/app/profiles/${row.id}`} className="home-family-name">
                  {name}
                </Link>
                <p>
                  {row.current_city || "City not set"}
                  {row.member_code ? <span>{row.member_code}</span> : null}
                </p>
                <p className="home-family-plan">
                  <b>{plan.name}</b>
                  <span>{plan.expiry}</span>
                </p>
                <dl>
                  <div>
                    <dt title="Profile views">Views</dt>
                    <dd>{s.views}</dd>
                  </div>
                  <div>
                    <dt title="Interests received">Interest in</dt>
                    <dd>{s.interestsIn}</dd>
                  </div>
                  <div>
                    <dt title="Interests sent">Interest out</dt>
                    <dd>{s.interestsOut}</dd>
                  </div>
                  <div>
                    <dt title="Chat threads">Chats</dt>
                    <dd>{s.chats}</dd>
                  </div>
                </dl>
                {on ? (
                  <button type="button" className={btnPrimary} disabled>
                    In use
                  </button>
                ) : (
                  <form action={setActiveProfile}>
                    <input type="hidden" name="id" value={row.id} />
                    <input type="hidden" name="next" value="/" />
                    <button type="submit" className={btnGhost}>
                      Switch
                    </button>
                  </form>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      <p className="home-family-cap">
        {listed.length} of {MAX_PROFILES_PER_ACCOUNT} profiles
        {room ? (
          <>
            {" · "}
            <Link href="/app/profiles/new">Add another</Link>
          </>
        ) : null}
      </p>
    </div>
  );
}
