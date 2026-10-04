import { BackToAccount } from "@/components/back-to-account";
import Link from "next/link";
import { PageShell } from "@/components/site-chrome";
import { ensureAppUser, getAuth } from "@/lib/auth/session";
import { createServiceClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { btnPrimary, cardClass } from "@/lib/ui/classes";

export default async function SafetyPage() {
  const { supabase, user } = await getAuth();
  if (!supabase || !user) redirect("/login?next=/app/safety");
  const me = await ensureAppUser(supabase, user);
  if (!me?.active_profile_id) redirect("/app");
  const db = createServiceClient() ?? supabase;
  const { data: reports } = await db
    .from("safety_reports")
    .select("id, category, status, created_at")
    .eq("reporter_profile_id", me.active_profile_id)
    .order("created_at", { ascending: false })
    .limit(20);

  return (
    <PageShell><BackToAccount />
      <main className="sx-stage safety-centre">
        <header className="page-head-panel"><p className="browse-kicker">Trust & safety</p>
        <h1>Your safety comes first</h1>
        <p className="set-lead">Keep conversations on Shree Lagna until you are comfortable. Never share OTPs, UPI PINs, passwords, bank details, or money.</p></header>
        <section className={`${cardClass} safety-guidance`}>
          <h2>When to report</h2>
          <ul>
            <li>Someone asks for money, financial details, OTPs, or urgent help.</li>
            <li>A profile appears fake, impersonates someone, or shares inappropriate content.</li>
            <li>You experience pressure, harassment, threats, or a serious mismatch in profile facts.</li>
          </ul>
          <Link href="/browse" className={btnPrimary}>Browse safely</Link>
        </section>
        <section className={`${cardClass} safety-urgent`}>
          <p className="browse-kicker">Need help now?</p>
          <h2>Get real-world help first</h2>
          <p>If there is immediate danger, threat, stalking, blackmail, or pressure to meet, stop the conversation and contact local emergency services. Shree Lagna cannot provide emergency response.</p>
          <div className="safety-helplines">
            <a href="tel:112"><b>112</b><span>India emergency response</span></a>
            <a href="tel:181"><b>181</b><span>Women helpline (availability can vary by state)</span></a>
            <a href="tel:1930"><b>1930</b><span>Cyber financial-fraud helpline</span></a>
            <a href="https://cybercrime.gov.in/" target="_blank" rel="noreferrer"><b>Cybercrime portal</b><span>File a cybercrime report in India</span></a>
          </div>
        </section>
        <section className={`${cardClass} safety-guidance`}>
          <h2>Meet safely, especially for women</h2>
          <ul>
            <li>Keep early conversations in Shree Lagna. Do not share your OTP, address, UPI PIN, bank details, or private documents.</li>
            <li>Tell a trusted family member before meeting. Choose a public place, arrange your own travel, and keep your phone charged.</li>
            <li>Do not send money, invest, or respond to “urgent” financial stories. A genuine match will respect boundaries.</li>
            <li>Block and report anyone who pressures you, becomes abusive, asks for secrecy, or gives inconsistent profile information.</li>
          </ul>
          <p>Reports are confidential. We may restrict or remove accounts after review, but we do not investigate crimes or replace police support.</p>
        </section>
        <section className={`${cardClass} safety-reports`}>
          <h2>Your confidential reports</h2>
          {reports?.length ? (
            <ul>
              {reports.map((report) => <li key={report.id}>{report.category.replace(/_/g, " ")} · {report.status.replace(/_/g, " ")}</li>)}
            </ul>
          ) : <p>You have not sent a report.</p>}
        </section>
      </main>
    </PageShell>
  );
}
