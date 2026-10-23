import { requireDesk } from "@/lib/desk/access";
import { createServiceClient } from "@/lib/supabase/server";
import { updateSafetyCase } from "@/app/desk/safety/actions";
import {
  loadSafetyParties,
  safetyCategoryLabel,
  safetyPartyLabel,
  safetyStatusLabel,
} from "@/lib/desk/safety-cases";
import { formatIstDateTime } from "@/lib/time/ist";
import { btnPrimary } from "@/lib/ui/classes";
import Link from "next/link";
import { profileOpenHref } from "@/lib/ui/dismiss";

export default async function DeskSafetyPage() {
  const desk = await requireDesk("/desk/safety");
  if (!desk.allowed) return null;
  const db = createServiceClient() ?? desk.supabase;
  const { data: cases } = await db
    .from("safety_reports")
    .select("id, category, details, status, staff_note, created_at, reporter_profile_id, reported_profile_id")
    .order("created_at", { ascending: false })
    .limit(40);
  const people = await loadSafetyParties(
    db as never,
    (cases ?? []).flatMap((item) => [item.reporter_profile_id, item.reported_profile_id]),
  );
  const openCount = cases?.filter((item) => item.status !== "resolved" && item.status !== "dismissed").length ?? 0;

  return (
    <section className="desk-panel">
      <header className="desk-panel-head">
        <div>
          <p className="browse-kicker">Trust & safety</p>
          <h2>Reports from families</h2>
        </div>
        <p>{openCount} still open</p>
      </header>
      {cases?.length ? (
        <ul className="desk-safety-list">
          {cases.map((item) => {
            const reporter = people.get(item.reporter_profile_id);
            const reported = people.get(item.reported_profile_id);
            return (
              <li key={item.id} className="desk-safety-case">
                <header className="desk-safety-case-head">
                  <strong>{safetyCategoryLabel(item.category)}</strong>
                  <span className={`desk-pill ${item.status === "resolved" || item.status === "dismissed" ? "is-done" : item.status === "in_review" ? "is-busy" : "is-new"}`}>
                    {safetyStatusLabel(item.status)}
                  </span>
                  <time>{item.created_at ? formatIstDateTime(String(item.created_at)) : "Recently"}</time>
                </header>
                <dl className="desk-safety-parties">
                  <div>
                    <dt>Who raised it</dt>
                    <dd>
                      {reporter ? (
                        <Link href={profileOpenHref(reporter.id, "safety")}>{safetyPartyLabel(reporter)}</Link>
                      ) : (
                        safetyPartyLabel(undefined, item.reporter_profile_id)
                      )}
                      {reporter?.email ? <small>{reporter.email}</small> : null}
                      {reporter?.place ? <small>{reporter.place}</small> : null}
                    </dd>
                  </div>
                  <div>
                    <dt>Who they flagged</dt>
                    <dd>
                      {reported ? (
                        <Link href={profileOpenHref(reported.id, "safety")}>{safetyPartyLabel(reported)}</Link>
                      ) : (
                        safetyPartyLabel(undefined, item.reported_profile_id)
                      )}
                      {reported?.place ? <small>{reported.place}</small> : null}
                      {reported ? (
                        <span className="desk-safety-links">
                          <Link href={profileOpenHref(reported.id, "safety")}>View profile</Link>
                          <Link href={`/app/profiles/${reported.id}`}>Edit in desk</Link>
                        </span>
                      ) : null}
                    </dd>
                  </div>
                </dl>
                <p className="desk-safety-note">
                  <span>What they wrote</span>
                  {item.details?.trim() || "No extra details."}
                </p>
                <form action={updateSafetyCase} className="desk-safety-tools">
                  <input type="hidden" name="id" value={item.id} />
                  <select name="status" defaultValue={item.status} aria-label="Case status">
                    <option value="new">New</option>
                    <option value="in_review">In review</option>
                    <option value="resolved">Resolved</option>
                    <option value="dismissed">Dismissed</option>
                  </select>
                  <input name="staff_note" defaultValue={item.staff_note ?? ""} placeholder="Staff note" />
                  <button className={btnPrimary}>Save</button>
                </form>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="desk-empty">No safety reports yet.</p>
      )}
    </section>
  );
}
