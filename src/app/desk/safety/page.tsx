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
import { btnGhost, btnPrimary, cardClass } from "@/lib/ui/classes";
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
    .limit(100);
  const people = await loadSafetyParties(
    db as never,
    (cases ?? []).flatMap((item) => [item.reporter_profile_id, item.reported_profile_id]),
  );

  return (
    <section className="desk-panel">
      <header className="desk-panel-head">
        <div>
          <p className="browse-kicker">Trust & safety</p>
          <h2>Safety cases</h2>
        </div>
        <p>{cases?.filter((item) => item.status !== "resolved" && item.status !== "dismissed").length ?? 0} open</p>
      </header>
      {cases?.length ? (
        <ul className="desk-ticket-list">
          {cases.map((item) => {
            const reporter = people.get(item.reporter_profile_id);
            const reported = people.get(item.reported_profile_id);
            return (
              <li key={item.id} className={`${cardClass} card-3d desk-ticket-row desk-safety-row`}>
                <div className="desk-ticket-row-main">
                  <div className="desk-ticket-row-head">
                    <span className="desk-ticket-name">{safetyCategoryLabel(item.category)}</span>
                    <span className={`desk-pill ${item.status === "resolved" || item.status === "dismissed" ? "is-done" : item.status === "in_review" ? "is-busy" : "is-new"}`}>
                      {safetyStatusLabel(item.status)}
                    </span>
                  </div>
                  <p className="desk-ticket-meta">Reported {item.created_at ? formatIstDateTime(String(item.created_at)) : "recently"}</p>
                  <dl className="desk-safety-parties">
                    <div>
                      <dt>Reported by</dt>
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
                      <dt>Profile reported</dt>
                      <dd>
                        {reported ? (
                          <Link href={profileOpenHref(reported.id, "safety")}>{safetyPartyLabel(reported)}</Link>
                        ) : (
                          safetyPartyLabel(undefined, item.reported_profile_id)
                        )}
                        {reported ? (
                          <span className="desk-safety-links">
                            <Link href={profileOpenHref(reported.id, "safety")} className={btnGhost}>
                              View
                            </Link>
                            <Link href={`/app/profiles/${reported.id}`} className={btnGhost}>
                              Open in desk
                            </Link>
                          </span>
                        ) : null}
                        {reported?.place ? <small>{reported.place}</small> : null}
                      </dd>
                    </div>
                  </dl>
                  <p className="desk-safety-note">
                    <span>Their note</span>
                    {item.details?.trim() || "No extra details were added."}
                  </p>
                </div>
                <form action={updateSafetyCase} className="desk-ticket-ops">
                  <input type="hidden" name="id" value={item.id} />
                  <select name="status" defaultValue={item.status}>
                    <option value="new">New</option>
                    <option value="in_review">In review</option>
                    <option value="resolved">Resolved</option>
                    <option value="dismissed">Dismissed</option>
                  </select>
                  <input name="staff_note" defaultValue={item.staff_note ?? ""} placeholder="Internal case note" />
                  <button className={btnPrimary}>Update</button>
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
