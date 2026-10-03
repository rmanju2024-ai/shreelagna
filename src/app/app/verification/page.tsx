import Link from "next/link";
import { PageShell } from "@/components/site-chrome";
import { ensureAppUser, getAuth } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { requestVerification } from "@/app/app/verification/actions";
import { btnPrimary, cardClass } from "@/lib/ui/classes";

export default async function MemberVerificationPage() {
  const { supabase, user } = await getAuth();
  if (!supabase || !user) redirect("/login?next=/app/verification");
  const me = await ensureAppUser(supabase, user);
  if (!me?.active_profile_id) redirect("/app/profiles/new");
  const { data: cases } = await supabase.from("profile_verification_cases").select("id, document_type, status, created_at, recheck_due_at, rejection_reason").eq("profile_id", me.active_profile_id).order("created_at", { ascending: false }).limit(20);
  return <PageShell><section className="sx-stage public-stage">
    <p className="browse-kicker">Optional trust checks</p><h1>Verification requests</h1>
    <p className="legal-effective">Request a review first. We will tell you the secure private method to share evidence—never upload ID, PAN, Aadhaar, bank details, passwords, or OTPs in chat.</p>
    <div className="public-card-grid">
      {["identity", "education", "employment"].map((type) => <form key={type} action={requestVerification} className={cardClass}>
        <input type="hidden" name="document_type" value={type} /><h2>{type[0].toUpperCase() + type.slice(1)} check</h2>
        <p>Request a private, admin-reviewed {type} check. Evidence is retained for a maximum of 90 days.</p><button className={btnPrimary}>Request review</button>
      </form>)}
    </div>
    <h2>Your requests</h2>
    <ul className="desk-ticket-list">{cases?.map((item) => <li className={`${cardClass} desk-ticket-row`} key={item.id}><span className="desk-ticket-row-main"><b>{item.document_type}</b><small>{item.status.replace(/_/g, " ")}</small>{item.rejection_reason ? <small>Reason: {item.rejection_reason}</small> : null}</span></li>)}</ul>
    <p className="legal-effective">Need to correct a rejected request? <Link href="/contact">Contact Support</Link> and include your profile ID.</p>
  </section></PageShell>;
}
