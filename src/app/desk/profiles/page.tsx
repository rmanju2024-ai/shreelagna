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

export const dynamic = "force-dynamic";

const SELECT =
  "id, member_code, subject_full_name, status, is_complete, profile_type, created_by, created_at, about";
const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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

function ProfileDeskRow({ row }: { row: DeskProfile }) {
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
          {" · "}
          {formatIstDateTime(String(row.created_at ?? ""))}
        </span>
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
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const desk = await requireDesk("/desk/profiles");
  if (!desk.allowed) return null;
  const { q: rawQ, page: rawPage } = await searchParams;
  const q = (rawQ ?? "").trim();
  const page = deskPage(rawPage);
  const { from, to } = deskRange(page);
  const db = createServiceClient() ?? desk.supabase;
  const adminIds = desk.admin ? new Set<string>() : await fetchAdminUserIds(db);

  let found: DeskProfile | null = null;
  let listed: DeskProfile[] = [];
  let reviewCount = 0;
  let missing = false;

  if (q) {
    const code = q.toUpperCase();
    const byId = UUID.test(q);
    const { data } = byId
      ? await db.from("profiles").select(SELECT).eq("id", q).maybeSingle()
      : await db.from("profiles").select(SELECT).eq("member_code", code).maybeSingle();
    if (data && (desk.admin || !adminIds.has(String(data.created_by)))) found = data;
    else missing = true;
  } else {
    const reviewRes = await excludeAdmins(
      db
        .from("profiles")
        .select(SELECT, { count: "exact" })
        .or("status.eq.pending_review,and(status.eq.draft,is_complete.eq.true)")
        .order("created_at", { ascending: false }),
      adminIds,
    ).range(from, to);
    listed = reviewRes.data ?? [];
    reviewCount = reviewRes.count ?? listed.length;
  }

  return (
    <section className="desk-panel">
      <header className="desk-panel-head">
        <div>
          <p className="browse-kicker">Profiles</p>
          <h2>Review queue</h2>
        </div>
        <p>{q ? (found ? "1 found" : "No match") : `${reviewCount} in review`}</p>
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
          placeholder="Member ID"
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
        found ? (
          <ul className="desk-ticket-list">
            <ProfileDeskRow row={found} />
          </ul>
        ) : missing ? (
          <p className="desk-empty">No profile for that ID.</p>
        ) : null
      ) : listed.length ? (
        <>
          <ul className="desk-ticket-list">
            {listed.map((row) => (
              <ProfileDeskRow key={row.id} row={row} />
            ))}
          </ul>
          <DeskPager path="/desk/profiles" page={page} count={reviewCount} />
        </>
      ) : (
        <p className="desk-empty">No profiles waiting for review.</p>
      )}
    </section>
  );
}
