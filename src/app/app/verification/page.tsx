import { BackToAccount } from "@/components/back-to-account";
import Link from "next/link";
import { InnerShell as PageShell } from "@/components/chrome-layout";
import { ensureAppUser, getAuth } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { requestVerification, uploadVerificationEvidence } from "@/app/app/verification/actions";
import { EVIDENCE_BUCKET, EVIDENCE_MAX_FILES, EVIDENCE_RETENTION_NOTICE, evidenceFolder, evidenceStore } from "@/lib/verification/evidence";
import { btnPrimary, cardClass } from "@/lib/ui/classes";

const KINDS = [
  { id: "identity", title: "Identity check", accepts: "Any one government photo ID (Aadhaar masked, passport, driving licence). Hide the number except the last 4 digits." },
  { id: "education", title: "Education check", accepts: "Degree certificate or final marks card." },
  { id: "employment", title: "Employment check", accepts: "Recent offer letter or company ID card (no salary figures needed)." },
] as const;

const STEPS = ["Request", "Upload", "Review", "Decision"];

const NOTES: Record<string, string> = {
  ok: "Document received. Our team will review it within 3 working days.",
  type: "Please upload a PDF, JPG or PNG file.",
  size: "That file is over 5 MB. Please upload a smaller one.",
  limit: "You already uploaded the maximum of 3 files for this request.",
  closed: "That request is already decided. Start a new request instead.",
  missing: "Choose a file first.",
  storage: "Upload is temporarily unavailable. Please try again shortly.",
  auth: "Please sign in again.",
};

function stepOf(status: string, files: number) {
  if (status === "approved" || status === "rejected" || status === "expired") return 3;
  if (status === "in_review" || status === "appealed") return 2;
  return files ? 2 : 1;
}

export default async function MemberVerificationPage({ searchParams }: { searchParams: Promise<{ upload?: string }> }) {
  const { upload } = await searchParams;
  const { supabase, user } = await getAuth();
  if (!supabase || !user) redirect("/login?next=/app/verification");
  const me = await ensureAppUser(supabase, user);
  if (!me?.active_profile_id) redirect("/app/profiles/new");
  const { data: cases } = await supabase.from("profile_verification_cases").select("id, document_type, status, created_at, recheck_due_at, rejection_reason").eq("profile_id", me.active_profile_id).order("created_at", { ascending: false }).limit(20);
  const store = cases?.length ? await evidenceStore() : null;
  const fileCount = new Map<string, number>();
  for (const item of cases ?? []) {
    const listed = store ? await store.storage.from(EVIDENCE_BUCKET).list(evidenceFolder(me.active_profile_id, item.id)) : null;
    fileCount.set(item.id, listed?.data?.length ?? 0);
  }
  return (
    <PageShell><BackToAccount />
      <section className="sx-stage public-stage verify-page">
        <div className="verify-panel">
          <p className="browse-kicker">Optional trust checks</p>
          <h1>Verification</h1>
          <ol className="verify-how">
            <li><b>1 · Request</b><span>Pick a check below.</span></li>
            <li><b>2 · Upload</b><span>Add your document on the request.</span></li>
            <li><b>3 · Review</b><span>An admin checks it privately within 3 working days.</span></li>
            <li><b>4 · Decision</b><span>You get a badge, or a reason and a way to appeal.</span></li>
          </ol>
          <p className="verify-safe">{EVIDENCE_RETENTION_NOTICE} Never share ID, bank details, passwords or OTPs in chat.</p>
          {upload && NOTES[upload] ? <p className={`verify-note${upload === "ok" ? " is-ok" : ""}`}>{NOTES[upload]}</p> : null}

          <h2>Start a check</h2>
          <div className="public-card-grid">
            {KINDS.map((kind) => (
              <form key={kind.id} action={requestVerification} className={cardClass}>
                <input type="hidden" name="document_type" value={kind.id} />
                <h3>{kind.title}</h3>
                <p>{kind.accepts}</p>
                <button className={btnPrimary}>Request review</button>
              </form>
            ))}
          </div>

          <h2>Your requests</h2>
          {cases?.length ? (
            <ul className="verify-cases">
              {cases.map((item) => {
                const files = fileCount.get(item.id) ?? 0;
                const step = stepOf(item.status, files);
                const open = ["requested", "in_review", "appealed"].includes(item.status);
                return (
                  <li key={item.id} className={`${cardClass} verify-case`}>
                    <div className="verify-case-head">
                      <b>{item.document_type[0].toUpperCase() + item.document_type.slice(1)} check</b>
                      <span className="verify-status">{item.status.replace(/_/g, " ")}</span>
                    </div>
                    <ol className="verify-steps" aria-label="Progress">
                      {STEPS.map((label, index) => (
                        <li key={label} className={index < step ? "is-done" : index === step ? "is-now" : undefined}>{label}</li>
                      ))}
                    </ol>
                    {item.status === "rejected" && item.rejection_reason ? <p className="verify-note">Reason: {item.rejection_reason}</p> : null}
                    {item.status === "approved" ? <p className="verify-note is-ok">Verified. {EVIDENCE_RETENTION_NOTICE} Re-check due {item.recheck_due_at ? new Date(item.recheck_due_at).toLocaleDateString("en-IN") : "in 2 years"}.</p> : null}
                    {open ? (
                      <form action={uploadVerificationEvidence} className="verify-upload">
                        <input type="hidden" name="case_id" value={item.id} />
                        <label>
                          <span>{files ? `Add another document (${files}/${EVIDENCE_MAX_FILES} uploaded)` : "Upload your document"} · PDF, JPG or PNG, max 5 MB</span>
                          <input type="file" name="file" accept="application/pdf,image/jpeg,image/png" required />
                        </label>
                        <button className={btnPrimary}>Upload</button>
                      </form>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="verify-safe">No requests yet.</p>
          )}
          <p className="verify-safe">Rejected? <Link href="/contact">Contact Support</Link> with your profile ID to appeal.</p>
        </div>
      </section>
    </PageShell>
  );
}
