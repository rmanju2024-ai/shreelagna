import { DeskPager } from "@/app/desk/desk-pager";
import { setProfileStatus } from "@/app/desk/profiles/actions";
import { fetchAdminUserIds } from "@/lib/desk/admin-ids";
import { requireDesk } from "@/lib/desk/access";
import { deskPage, deskRange } from "@/lib/desk/pager";
import { createServiceClient } from "@/lib/supabase/server";
import { activeContactFlags, contentFlagLabel } from "@/lib/moderation/content-flags";
import { formatIstDateTime } from "@/lib/time/ist";
import { btnGhost, btnPrimary, cardClass, inputClass } from "@/lib/ui/classes";
import Link from "next/link";
import { ProfileDeleteControl } from "@/app/app/profiles/profile-delete-control";

const SELECT =
  "id, member_code, subject_full_name, status, is_complete, profile_type, created_by, created_at, about";
const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
type QueueView = "ready" | "incomplete";

function statusLabel(status: string) {
  if (status === "on_hold") return "Paused";
  if (status === "hidden") return "Hidden";
  if (status === "active") return "Live";
  if (status === "pending_review") return "Review";
  return status.replace(/_/g, " ");
}

type DeskProfile = {
  id: string;
  member_code?: string | null;
  subject_full_name?: string | null;
  status?: string | null;
  is_complete?: boolean | null;
  profile_type?: string | null;
  created_by?: string | null;
  created_at?: string | null;
  about?: string | null;
};

function needsReview(row: DeskProfile) {
  const status = String(row.status ?? "draft");
  return status === "pending_review" || (Boolean(row.is_complete) && status === "draft");
}

function ProfileDeskRow({ row, queue }: { row: DeskProfile; queue: QueueView }) {
  const status = String(row.status ?? "draft");
  const review = needsReview(row);
  const flags = review ? activeContactFlags(typeof row.about === "string" ? row.about : "") : [];
  return (
    <li className={`${cardClass} card-3d desk-ticket-row`}>
      <span className="desk-ticket-row-main">
        <span className="desk-ticket-row-head">
          <span className="desk-ticket-name">{row.subject_full_name || "Unnamed"}</span>
          <span className={`desk-pill ${status === "active" ? "is-done" : review ? "is-new" : status === "on_hold" ? "is-hold" : "is-new"}`}>
            {statusLabel(review ? "pending_review" : status)}
          </span>
        </span>
        <span className="desk-ticket-meta">
          {row.member_code || row.id}
          {" · "}
          {row.profile_type}
          {row.is_complete ? " · Complete" : ""}
          {review ? " · Check album, intro, About" : ""}
          {queue === "incomplete" ? " · Needs required details" : ""}
          {" · "}
          {formatIstDateTime(String(row.created_at ?? ""))}
        </span>
        {queue === "incomplete" ? (
          <span className="desk-profile-nudge">
            Not visible in search or matches yet. This profile cannot send requests or start chats until required details are complete and the profile is approved.
          </span>
        ) : null}
        {flags.length ? (
          <span className="desk-ticket-flags">{flags.map((flag) => contentFlagLabel(flag)).join(" · ")}</span>
        ) : null}
      </span>
      <span className="desk-ticket-ops">
        <Link href={`/browse/${row.id}`} className={btnGhost}>
          View
        </Link>
        <Link href={`/app/profiles/${row.id}`} className={btnGhost}>
          Edit
        </Link>
        {status !== "active" ? (
          <form action={setProfileStatus}>
            <input type="hidden" name="id" value={row.id} />
            <input type="hidden" name="status" value="active" />
            <button className={btnGhost} type="submit">
              {review ? "Approve" : "Live"}
            </button>
          </form>
        ) : null}
        {status !== "on_hold" ? (
          <form action={setProfileStatus}>
            <input type="hidden" name="id" value={row.id} />
            <input type="hidden" name="status" value="on_hold" />
            <button className={btnGhost} type="submit">
              Pause
            </button>
          </form>
        ) : null}
        {status !== "hidden" ? (
          <form action={setProfileStatus}>
            <input type="hidden" name="id" value={row.id} />
            <input type="hidden" name="status" value="hidden" />
            <button className={btnGhost} type="submit">
              Hide
            </button>
          </form>
        ) : null}
        <ProfileDeleteControl profileId={row.id} staff compact />
      </span>
    </li>
  );
}

function excludeAdmins<T>(query: T, adminIds: Set<string>): T {
  if (!adminIds.size) return query;
  return (query as T & { not: (col: string, op: string, value: string) => T }).not(
    "created_by",
    "in",
    `(${[...adminIds].join(",")})`,
  );
}

export default async function DeskProfilesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string; view?: string }>;
}) {
  const desk = await requireDesk("/desk/profiles");
  if (!desk.allowed) return null;
  const { q: rawQ, page: rawPage, view: rawView } = await searchParams;
  const q = (rawQ ?? "").trim();
  const view: QueueView = rawView === "incomplete" ? "incomplete" : "ready";
  const page = deskPage(rawPage);
  const { from, to } = deskRange(page);
  const db = createServiceClient() ?? desk.supabase;
  const adminIds = desk.admin ? new Set<string>() : await fetchAdminUserIds(db as never);

  let found: DeskProfile[] = [];
  let listed: DeskProfile[] = [];
  let readyCount = 0;
  let incompleteCount = 0;
  let missing = false;

  if (q) {
    const code = q.toUpperCase();
    const byId = UUID.test(q);
    const { data } = byId
      ? await db.from("profiles").select(SELECT).eq("id", q)
      : await db.from("profiles").select(SELECT).ilike("member_code", `%${code}%`).order("member_code").limit(50);
    found = (data ?? []).filter((row) => desk.admin || !adminIds.has(String(row.created_by)));
    missing = found.length === 0;
  } else {
    const readyQuery = () =>
      excludeAdmins(
        db
        .from("profiles")
        .select(SELECT, { count: "exact" })
        .or("status.eq.pending_review,and(status.eq.draft,is_complete.eq.true)")
        .order("created_at", { ascending: false }),
        adminIds,
      );
    const incompleteQuery = () =>
      excludeAdmins(
        db
          .from("profiles")
          .select(SELECT, { count: "exact" })
          .eq("status", "draft")
          .eq("is_complete", false)
          .order("created_at", { ascending: false }),
        adminIds,
      );
    const [readyResult, incompleteResult] = await Promise.all([
      readyQuery().range(view === "ready" ? from : 0, view === "ready" ? to : 0),
      incompleteQuery().range(view === "incomplete" ? from : 0, view === "incomplete" ? to : 0),
    ]);
    readyCount = readyResult.count ?? 0;
    incompleteCount = incompleteResult.count ?? 0;
    listed = (view === "ready" ? readyResult.data : incompleteResult.data) ?? [];
  }

  return (
    <section className="desk-panel">
      <header className="desk-panel-head">
        <div>
          <p className="browse-kicker">Profiles</p>
          <h2>Review queue</h2>
        </div>
        <p>{q ? (found.length ? `${found.length} found` : "No match") : `${view === "ready" ? readyCount : incompleteCount} shown`}</p>
      </header>
      <form className="desk-id-search" action="/desk/profiles" method="get">
        <label className="sr-only" htmlFor="desk-profile-id">
          Member ID
        </label>
        <input
          id="desk-profile-id"
          className={inputClass}
          name="q"
          defaultValue={q}
          placeholder="Member ID or part of an ID"
          autoComplete="off"
        />
        <button className={btnPrimary} type="submit">
          Find
        </button>
        {q ? (
          <Link href="/desk/profiles" className={btnGhost}>
            Queue
          </Link>
        ) : null}
      </form>
      {q ? (
        found.length ? (
          <ul className="desk-ticket-list">
            {found.map((row) => (
              <ProfileDeskRow key={row.id} row={row} queue={row.is_complete ? "ready" : "incomplete"} />
            ))}
          </ul>
        ) : missing ? (
          <p className="desk-empty">No profile for that ID.</p>
        ) : null
      ) : (
        <>
          <nav className="desk-profile-queues" aria-label="Profile queues">
            <Link className={view === "ready" ? "is-active" : ""} href="/desk/profiles">
              Ready for review <span>{readyCount}</span>
            </Link>
            <Link className={view === "incomplete" ? "is-active" : ""} href="/desk/profiles?view=incomplete">
              Needs required details <span>{incompleteCount}</span>
            </Link>
          </nav>
          {view === "incomplete" ? (
            <p className="desk-profile-queue-note">
              These drafts stay private until their required details are complete. They cannot appear in search or matches, send requests, or start chats.
            </p>
          ) : null}
          {listed.length ? (
            <>
          <ul className="desk-ticket-list">
            {listed.map((row) => (
              <ProfileDeskRow key={row.id} row={row} queue={view} />
            ))}
          </ul>
              <DeskPager path="/desk/profiles" page={page} count={view === "ready" ? readyCount : incompleteCount} extra={view === "incomplete" ? { view } : {}} />
            </>
          ) : (
            <p className="desk-empty">
              {view === "ready" ? "No completed profiles are waiting for review." : "No incomplete draft profiles need follow-up."}
            </p>
          )}
        </>
      )}
    </section>
  );
}
