import { requireDesk } from "@/lib/desk/access";
import { cachedStaffRoster } from "@/lib/desk/cached";
import { createServiceClient } from "@/lib/supabase/server";
import { updateSafetyCase } from "@/app/desk/safety/actions";
import { SafetyThreadPeek } from "@/app/desk/safety/thread-peek";
import { AssignBar, QueueViewLinks, SlaMark } from "@/app/desk/queue-tools";
import {
  loadSafetyParties,
  safetyCategoryLabel,
  safetyPartyLabel,
  safetyStatusLabel,
} from "@/lib/desk/safety-cases";
import { fitsQueue, parseQueueView } from "@/lib/desk/sla";
import { staffOptionLabel } from "@/lib/desk/staff-options";
import { formatIstDateTime } from "@/lib/time/ist";
import { btnPrimary } from "@/lib/ui/classes";
import Link from "next/link";
import { profileOpenHref } from "@/lib/ui/dismiss";

export default async function DeskSafetyPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const desk = await requireDesk("/desk/safety");
  if (!desk.allowed) return null;
  const { view: rawView } = await searchParams;
  const view = parseQueueView(rawView);
  const db = createServiceClient() ?? desk.supabase;
  const listed = await db
    .from("safety_reports")
    .select("id, category, details, status, staff_note, created_at, reporter_profile_id, reported_profile_id, assigned_to, due_at")
    .order("created_at", { ascending: false })
    .limit(40);
  const rawCases = listed.error
    ? ((
        await db
          .from("safety_reports")
          .select("id, category, details, status, staff_note, created_at, reporter_profile_id, reported_profile_id")
          .order("created_at", { ascending: false })
          .limit(40)
      ).data ?? [])
    : (listed.data ?? []);
  const staffId = desk.me?.id ?? "";
  const cases = rawCases.filter((item) =>
    fitsQueue(
      {
        assignedTo: "assigned_to" in item ? (item.assigned_to as string | null) : null,
        createdAt: item.created_at,
        dueAt: "due_at" in item ? (item.due_at as string | null) : null,
        status: item.status,
      },
      view,
      staffId,
    ),
  );
  const roster = await cachedStaffRoster().catch(() => []);
  const staff = roster.map((row) => ({ id: row.id, label: staffOptionLabel(row) }));
  const people = await loadSafetyParties(
    db as never,
    cases.flatMap((item) => [item.reporter_profile_id, item.reported_profile_id]),
  );
  const openCount = cases.filter((item) => item.status !== "resolved" && item.status !== "dismissed").length;

  return (
    <section className="desk-panel">
      <header className="desk-panel-head">
        <div>
          <p className="browse-kicker">Trust & safety</p>
          <h2>Reports from families</h2>
        </div>
        <p>{openCount} still open</p>
      </header>
      <QueueViewLinks path="/desk/safety" view={view} />
      {cases.length ? (
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
                <SlaMark
                  createdAt={item.created_at}
                  dueAt={"due_at" in item ? String(item.due_at ?? "") : null}
                  status={item.status}
                  assignedTo={"assigned_to" in item ? String(item.assigned_to ?? "") : null}
                />
                <SafetyThreadPeek
                  db={db}
                  reporterId={item.reporter_profile_id}
                  reportedId={item.reported_profile_id}
                />
                <AssignBar
                  kind="safety"
                  id={item.id}
                  assignedTo={"assigned_to" in item ? String(item.assigned_to ?? "") : null}
                  staff={staff}
                />
                <form action={updateSafetyCase} className="desk-safety-tools">
                  <input type="hidden" name="id" value={item.id} />
                  <select name="status" defaultValue={item.status} aria-label="Case status">
                    <option value="new">New</option>
                    <option value="in_review">In review</option>
                    <option value="resolved">Resolved</option>
                    <option value="dismissed">Dismissed</option>
                  </select>
                  <input name="staff_note" defaultValue={item.staff_note ?? ""} placeholder="Staff note" />
                  <label className="desk-check-row">
                    <input type="checkbox" name="hide_profile" />
                    Hide reported profile
                  </label>
                  <label className="desk-check-row">
                    <input type="checkbox" name="block_both" />
                    Block both sides
                  </label>
                  <label className="desk-check-row">
                    <input type="checkbox" name="freeze_chat" />
                    Freeze their chat
                  </label>
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
