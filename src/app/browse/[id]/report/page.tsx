import { reportProfile } from "@/app/app/safety/actions";
import { ensureAppUser, getAuth } from "@/lib/auth/session";
import { InnerShell as PageShell } from "@/components/chrome-layout";
import { displayFirstName } from "@/lib/profile/options";
import { BackLink } from "@/components/back-link";
import { redirect } from "next/navigation";

const REASONS = [
  { id: "fake_profile", icon: "🎭", label: "Fake or impersonated" },
  { id: "harassment", icon: "🚫", label: "Harassment or threats" },
  { id: "money_request", icon: "💸", label: "Asked for money" },
  { id: "inappropriate_content", icon: "🔞", label: "Inappropriate content" },
  { id: "marital_status", icon: "💍", label: "Marital-status concern" },
  { id: "other", icon: "💬", label: "Something else" },
];

export default async function ReportProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, user } = await getAuth();
  if (!supabase || !user) redirect(`/login?next=/browse/${id}/report`);
  const me = await ensureAppUser(supabase, user);
  if (!me) redirect("/login?error=account");
  const { data: profile } = await supabase.from("profiles").select("subject_full_name, member_code").eq("id", id).maybeSingle();
  const name = displayFirstName(typeof profile?.subject_full_name === "string" ? profile.subject_full_name : "this member");
  const back = `/browse/${id}`;

  return (
    <PageShell>
      <section className="report-page">
        <BackLink fallback={back} className="report-back">← Back to profile</BackLink>
        <div className="report-card">
          <p className="report-kicker">Confidential · only our safety team sees this</p>
          <h1>Report {name}</h1>
          <p className="report-sub">Tell us what felt off. {name} is never told who reported.</p>
          <form action={reportProfile} className="report-form">
            <input type="hidden" name="profile_id" value={id} />
            <input type="hidden" name="return_to" value={back} />
            <fieldset>
              <legend>What happened?</legend>
              <div className="report-reasons">
                {REASONS.map((r, i) => (
                  <label key={r.id} className="report-reason">
                    <input type="radio" name="category" value={r.id} defaultChecked={i === 0} />
                    <span><b>{r.icon}</b> {r.label}</span>
                  </label>
                ))}
              </div>
            </fieldset>
            <label className="report-details">
              Details (optional)
              <textarea name="details" maxLength={2000} placeholder="Share only useful context. Never add passwords, OTPs or bank details." />
            </label>
            <div className="report-actions">
              <button type="submit" className="report-send">Send confidential report</button>
              <BackLink fallback={back} className="report-cancel">Cancel</BackLink>
            </div>
          </form>
        </div>
      </section>
    </PageShell>
  );
}
