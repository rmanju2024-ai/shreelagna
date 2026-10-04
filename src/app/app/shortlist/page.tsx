import { BackToAccount } from "@/components/back-to-account";
import Link from "next/link";
import { PageShell } from "@/components/site-chrome";
import { ensureAppUser, getAuth } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { cardClass } from "@/lib/ui/classes";

export default async function ShortlistPage() {
  const { supabase, user } = await getAuth();
  if (!supabase || !user) redirect("/login?next=/app/shortlist");
  const me = await ensureAppUser(supabase, user);
  if (!me?.active_profile_id) redirect("/app");
  const { data: saved } = await supabase.from("profile_shortlists").select("shortlisted_profile_id, created_at").eq("owner_profile_id", me.active_profile_id).order("created_at", { ascending: false });
  const ids = (saved ?? []).map((row) => row.shortlisted_profile_id);
  const { data: profiles } = ids.length ? await supabase.from("profiles").select("id, subject_full_name, status, current_city, current_state").in("id", ids) : { data: [] };
  const byId = new Map((profiles ?? []).filter((row) => row.status === "active").map((row) => [row.id, row]));
  return <PageShell><BackToAccount /><main className="sx-stage"><header className="page-head-panel"><p className="browse-kicker">Your picks</p><h1>Shortlisted profiles</h1><p className="set-lead">Keep thoughtful possibilities together. A shortlist is private to you.</p></header><div className="sx-grid">{ids.map((id) => { const p = byId.get(id); return p ? <Link key={id} href={`/browse/${id}`} className={`${cardClass} sx-card`}><h2>{p.subject_full_name}</h2><p>{[p.current_city, p.current_state].filter(Boolean).join(", ") || "India"}</p><span>View profile →</span></Link> : null; })}</div>{!byId.size ? <p className="desk-empty">No active profiles in your shortlist yet.</p> : null}</main></PageShell>;
}
