import { requireDesk } from "@/lib/desk/access";
import { createServiceClient } from "@/lib/supabase/server";
import { reviewVerificationCase } from "@/app/desk/verification/actions";
import { btnPrimary, cardClass } from "@/lib/ui/classes";
import { EVIDENCE_BUCKET, evidenceFolder, evidenceStore } from "@/lib/verification/evidence";

export default async function DeskVerificationPage() {
  const desk = await requireDesk("/desk/verification");
  if (!desk.allowed) return null;
  const db = createServiceClient() ?? desk.supabase;
  const { data: cases } = await db
    .from("profile_verification_cases")
    .select("id, profile_id, document_type, status, created_at, evidence_delete_after, review_note")
    .in("status", ["requested", "in_review", "appealed"])
    .order("created_at", { ascending: true })
    .limit(100);
  // Short-lived signed links (10 min) are created only for admins reviewing a case.
  const store = desk.admin && cases?.length ? await evidenceStore() : null;
  const links = new Map<string, { name: string; url: string }[]>();
  for (const item of cases ?? []) {
    if (!store) break;
    const folder = evidenceFolder(item.profile_id, item.id);
    const listed = await store.storage.from(EVIDENCE_BUCKET).list(folder);
    const signed: { name: string; url: string }[] = [];
    for (const file of listed.data ?? []) {
      const url = await store.storage.from(EVIDENCE_BUCKET).createSignedUrl(`${folder}/${file.name}`, 600);
      if (url.data?.signedUrl) signed.push({ name: file.name, url: url.data.signedUrl });
    }
    links.set(item.id, signed);
  }
  return (
    <section className="desk-panel">
      <header className="desk-panel-head"><div><p className="browse-kicker">Restricted review</p><h2>Verification cases</h2></div><p>{cases?.length ?? 0} waiting</p></header>
      <p className="desk-profile-queue-note">Only administrators can approve document-based checks. Evidence must stay in private storage and be deleted by the stated retention date.</p>
      {cases?.length ? <ul className="desk-ticket-list">{cases.map((item) => (
        <li key={item.id} className={`${cardClass} card-3d desk-ticket-row desk-profile-row`}>
          <div className="desk-profile-summary">
            <div className="desk-ticket-row-head"><b>{item.document_type} check</b><span className="desk-profile-chip">{item.status.replace(/_/g, " ")}</span></div>
            <span className="desk-ticket-meta">Profile {item.profile_id} · Requested {new Date(item.created_at).toLocaleDateString("en-IN")} · Evidence deletion due {new Date(item.evidence_delete_after).toLocaleDateString("en-IN")}</span>
            {(links.get(item.id) ?? []).length ? <span className="desk-ticket-meta">Evidence: {(links.get(item.id) ?? []).map((f, i) => <a key={f.name} href={f.url} target="_blank" rel="noreferrer">File {i + 1}</a>).reduce<React.ReactNode[]>((acc, el, i) => (i ? [...acc, " · ", el] : [el]), [])}</span> : <span className="desk-ticket-meta">No document uploaded yet</span>}
          </div>
          {desk.admin ? <form action={reviewVerificationCase} className="desk-profile-actions">
            <input type="hidden" name="id" value={item.id} />
            <select name="status" defaultValue="in_review"><option value="in_review">In review</option><option value="approved">Approve</option><option value="rejected">Reject</option><option value="expired">Expire</option></select>
            <input name="note" defaultValue={item.review_note ?? ""} maxLength={500} placeholder="Internal reason / decision note" />
            <button className={btnPrimary}>Save decision</button>
          </form> : <span className="desk-profile-check">Admin decision required</span>}
        </li>
      ))}</ul> : <p className="desk-empty">No verification cases are waiting.</p>}
    </section>
  );
}
