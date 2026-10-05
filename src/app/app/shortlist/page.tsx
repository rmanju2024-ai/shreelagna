import { toggleShortlist } from "@/app/app/profiles/actions";
import { SafetyFlash } from "@/app/browse/safety-flash";
import { BackToAccount } from "@/components/back-to-account";
import { InnerShell as PageShell } from "@/components/chrome-layout";
import { ensureAppUser, getAuth } from "@/lib/auth/session";
import { publicMediaUrl } from "@/lib/match/inbox-card";
import { yearsFromDob } from "@/lib/profile/completeness";
import { displayFirstName, maritalLabel } from "@/lib/profile/options";
import { createServiceClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function ShortlistPage({ searchParams }: { searchParams: Promise<{ safety?: string }> }) {
  const { safety } = await searchParams;
  const { supabase, user } = await getAuth();
  if (!supabase || !user) redirect("/login?next=/app/shortlist");
  const me = await ensureAppUser(supabase, user);
  if (!me?.active_profile_id) redirect("/app");
  const db = createServiceClient() ?? supabase;
  const { data: saved } = await db
    .from("profile_shortlists")
    .select("shortlisted_profile_id, created_at")
    .eq("owner_profile_id", me.active_profile_id)
    .order("created_at", { ascending: false });
  const ids = (saved ?? []).map((row) => row.shortlisted_profile_id as string);
  const [{ data: profiles }, { data: photos }] = ids.length
    ? await Promise.all([
        db.from("profiles").select(
          "id, subject_full_name, status, current_city, current_state, current_country, occupation, date_of_birth, height_cm, qualification, mother_tongue, marital_status, employed_in",
        ).in("id", ids),
        db.from("media").select("profile_id, storage_path, is_primary").in("profile_id", ids).eq("kind", "photo").order("created_at"),
      ])
    : [{ data: [] }, { data: [] }];
  const byId = new Map((profiles ?? []).filter((row) => row.status === "active").map((row) => [row.id as string, row]));
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
          <p className="browse-kicker">Your picks</p>
          <h1>Shortlisted profiles</h1>
          <p className="set-lead">Keep thoughtful possibilities together. A shortlist is private to you.</p>
        </header>
        <SafetyFlash code={safety} />
        {rows.length ? (
          <ul className="list-cards">
            {rows.map((id) => {
              const p = byId.get(id)!;
              const photo = publicMediaUrl(photoOf.get(id));
              const name = displayFirstName(String(p.subject_full_name ?? "Member"));
              const age = typeof p.date_of_birth === "string" ? yearsFromDob(p.date_of_birth) : null;
              const place = [p.current_city, p.current_state, p.current_country].filter(Boolean).join(", ");
              const marital = maritalLabel(typeof p.marital_status === "string" ? p.marital_status : "") || "";
              const lineOne = [
                age != null ? `${age} yrs` : null,
                p.height_cm ? `${p.height_cm} cm` : null,
                place || null,
                marital || null,
              ]
                .filter(Boolean)
                .join(" · ");
              const lineTwo = [p.occupation, p.qualification, p.employed_in, p.mother_tongue]
                .filter((bit) => typeof bit === "string" && bit.trim())
                .join(" · ");
              return (
                <li key={id} className="list-card">
                  <Link href={`/browse/${id}`} className="list-card-main">
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
                      {lineOne ? <small>{lineOne}</small> : null}
                      {lineTwo ? <small>{lineTwo}</small> : null}
                    </span>
                  </Link>
                  <form action={toggleShortlist}>
                    <input type="hidden" name="profile_id" value={id} />
                    <input type="hidden" name="return_to" value="/app/shortlist" />
                    <button type="submit" className="list-card-btn">Remove</button>
                  </form>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="gz-state-card">
            No shortlisted profiles yet. Tap <b>♥ Shortlist</b> on any profile to save it here.
          </p>
        )}
      </main>
    </PageShell>
  );
}
