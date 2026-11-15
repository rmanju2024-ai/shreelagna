import { BrowseProfileView } from "@/app/browse/browse-profile-view";
import { DeskPager } from "@/app/desk/desk-pager";
import { DeskPeek } from "@/app/desk/people/desk-peek";
import { StaffInboxPreview } from "@/app/desk/people/inbox-preview";
import { MemberDossier } from "@/app/desk/people/member-dossier";
import { StaffMemberEdit } from "@/app/desk/people/staff-edit";
import { requireDesk } from "@/lib/desk/access";
import { deskPage, deskRange } from "@/lib/desk/pager";
import { parsePeopleSort, peopleSortSpec } from "@/lib/desk/people-sort";
import { PeopleToolbar } from "@/app/desk/people/people-toolbar";
import { isMemberCode, memberCodeLookup } from "@/lib/profile/member-code";
import { pickPrimaryPhotoMap, publicMediaUrl } from "@/lib/match/inbox-card";
import { createServiceClient } from "@/lib/supabase/server";
import Image from "next/image";
import Link from "next/link";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const HIT_COLS =
  "id, member_code, subject_full_name, status, profile_type, current_city, current_state, created_at, updated_at, last_seen_at";

function statusLabel(status: string | null | undefined) {
  if (status === "on_hold") return "Paused";
  if (status === "hidden") return "Hidden";
  if (status === "active") return "Live";
  if (status === "pending_review") return "Review";
  if (status === "draft") return "Draft";
  return status ? status.replace(/_/g, " ") : "—";
}

function kindLabel(type: string | null | undefined) {
  if (type === "vadhu") return "Bride";
  if (type === "vara") return "Groom";
  return "Profile";
}

function peopleHref(open: string, extra: Record<string, string | undefined> = {}) {
  const q = new URLSearchParams();
  q.set("open", open);
  for (const [key, value] of Object.entries(extra)) {
    if (value) q.set(key, value);
  }
  return `/desk/people?${q.toString()}`;
}

export default async function DeskPeoplePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; sort?: string; page?: string; open?: string; peek?: string; thread?: string; tab?: string; section?: string; saved?: string; error?: string }>;
}) {
  const desk = await requireDesk("/desk/people");
  if (!desk.allowed) return null;
  const { q: raw, sort: sortRaw, page: pageRaw, open, peek, thread, tab, section, saved, error } = await searchParams;
  const q = String(raw ?? "").trim();
  const sort = parsePeopleSort(sortRaw);
  const spec = peopleSortSpec(sort);
  const page = deskPage(pageRaw);
  const { from, to } = deskRange(page);
  const db = createServiceClient() ?? desk.supabase;

  let query = db
    .from("profiles")
    .select(HIT_COLS, { count: "exact" })
    .order(spec.column, { ascending: spec.ascending, nullsFirst: false });
  if (q && !UUID.test(q) && !isMemberCode(q)) {
    query = query.ilike("subject_full_name", `%${q}%`);
  } else if (q && isMemberCode(q)) {
    query = query.eq("member_code", memberCodeLookup(q));
  } else if (q && UUID.test(q)) {
    query = query.eq("id", q);
  }
  const { data, count } = await query.range(from, to);
  const hits = data ?? [];
  const total = count ?? hits.length;
  const hitIds = hits.map((row) => String(row.id));
  const { data: photoRows } = hitIds.length
    ? await db
        .from("media")
        .select("profile_id, storage_path, is_primary")
        .eq("kind", "photo")
        .in("profile_id", hitIds)
        .order("created_at")
    : { data: [] };
  const photoMap = pickPrimaryPhotoMap(photoRows ?? []);
  const listQuery = () => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (sort !== "newest") params.set("sort", sort);
    return params;
  };
  const listHref = (id: string) => {
    const params = listQuery();
    params.set("open", id);
    return `/desk/people?${params.toString()}`;
  };
  const listExtra = Object.fromEntries(listQuery());

  let ownerId = "";
  if (open && (peek === "inbox" || peek === "profile")) {
    const { data: ownerRow } = await db.from("profiles").select("created_by").eq("id", open).maybeSingle();
    ownerId = String(ownerRow?.created_by ?? "");
  }
  const fileHref = open ? peopleHref(open) : "/desk/people";
  const closeQs = listQuery().toString();
  const closeList = closeQs ? `/desk/people?${closeQs}` : "/desk/people";

  return (
    <section className="desk-panel desk-file">
      <header className="desk-panel-head">
        <div>
          <p className="browse-kicker">Members</p>
          <h2>Directory</h2>
        </div>
        <p>{total} on file</p>
      </header>
      <PeopleToolbar q={q} sort={sort} />
      {q && !hits.length ? <p className="desk-empty">No member matched “{q}”.</p> : null}
      {hits.length ? (
        <ul className="desk-file-hits">
          {hits.map((row) => {
            const place = [row.current_city, row.current_state].filter(Boolean).join(", ");
            const thumb = publicMediaUrl(photoMap.get(row.id));
            return (
              <li key={row.id}>
                <Link href={listHref(row.id)} className="desk-file-hit" scroll={false}>
                  <span className="desk-file-thumb">
                    {thumb ? (
                      <Image
                        src={thumb}
                        alt=""
                        fill
                        sizes="48px"
                        quality={40}
                        style={{ objectFit: "cover", objectPosition: "center 18%" }}
                      />
                    ) : (
                      <em>{(row.subject_full_name || "?").slice(0, 1)}</em>
                    )}
                  </span>
                  <span className="desk-file-hit-copy">
                    <strong>{row.subject_full_name || "Unnamed"}</strong>
                    <small>
                      {[row.member_code, kindLabel(row.profile_type), place || null].filter(Boolean).join(" · ")}
                    </small>
                  </span>
                  <em className="desk-pill">{statusLabel(row.status)}</em>
                  <span className="desk-file-go" aria-hidden>
                    →
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : !q ? (
        <p className="desk-empty">No profiles on file yet.</p>
      ) : null}
      <DeskPager path="/desk/people" page={page} count={total} extra={listExtra} />

      {open && !peek ? (
        <DeskPeek title="Member file" kicker="Staff case · member file" closeHref={closeList}>
          <MemberDossier db={db} id={open} fileHref={fileHref} />
        </DeskPeek>
      ) : null}
      {open && peek === "profile" ? (
        <DeskPeek title="Profile preview" closeHref={fileHref}>
          <BrowseProfileView params={Promise.resolve({ id: open })} searchParams={Promise.resolve({ from: "desk" })} />
        </DeskPeek>
      ) : null}
      {open && peek === "inbox" ? (
        <DeskPeek title="Inbox preview" closeHref={fileHref}>
          <StaffInboxPreview db={db} profileId={open} ownerId={ownerId} tab={tab} threadId={thread} baseHref={fileHref} />
        </DeskPeek>
      ) : null}
      {open && peek === "edit" ? (
        <DeskPeek title="Edit member biodata" kicker="Staff edit · not your profile" closeHref={fileHref}>
          <StaffMemberEdit
            id={open}
            fileHref={fileHref}
            section={section}
            saved={saved === "1"}
            error={error}
          />
        </DeskPeek>
      ) : null}
    </section>
  );
}
