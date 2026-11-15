import type { ReactNode } from "react";
import { requireDesk } from "@/lib/desk/access";
import { safetyCategoryLabel } from "@/lib/desk/safety-cases";
import { ticketStatusLabel } from "@/lib/desk/tickets";
import { planByCode } from "@/lib/membership/catalog";
import { createServiceClient } from "@/lib/supabase/server";
import { formatIstDateTime } from "@/lib/time/ist";
import { btnGhost, inputClass } from "@/lib/ui/classes";
import { profileOpenHref } from "@/lib/ui/dismiss";
import Link from "next/link";
import { notFound } from "next/navigation";

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

function FileCard({
  kicker,
  title,
  count,
  children,
}: {
  kicker: string;
  title: string;
  count: number;
  children: ReactNode;
}) {
  return (
    <details className="desk-file-card">
      <summary>
        <span>
          <span className="desk-file-kicker">{kicker}</span>
          <strong>{title}</strong>
        </span>
        <b className="desk-file-count">{count}</b>
      </summary>
      <div className="desk-file-body">{children}</div>
    </details>
  );
}

export default async function DeskMemberFilePage({ params }: { params: Promise<{ id: string }> }) {
  const desk = await requireDesk("/desk/people");
  if (!desk.allowed) return null;
  const { id } = await params;
  const db = createServiceClient() ?? desk.supabase;
  const { data: profile } = await db
    .from("profiles")
    .select(
      "id, member_code, subject_full_name, status, profile_type, created_by, created_at, subject_mobile, phone_otp_verified_at, current_city, current_state",
    )
    .eq("id", id)
    .maybeSingle();
  if (!profile) notFound();

  const ownerId = String(profile.created_by ?? "");
  const owner = ownerId
    ? await db.from("app_users").select("id, email, display_name, role").eq("id", ownerId).maybeSingle()
    : { data: null as { email?: string | null } | null };
  const ticketOr = [
    profile.subject_mobile ? `mobile.eq.${profile.subject_mobile}` : "",
    owner.data?.email ? `email.eq.${owner.data.email}` : "",
  ]
    .filter(Boolean)
    .join(",");
  const [memberships, tickets, reports, threads] = await Promise.all([
    ownerId
      ? db
          .from("memberships")
          .select("id, plan_code, status, source, ends_at, note, created_at")
          .eq("user_id", ownerId)
          .order("created_at", { ascending: false })
          .limit(8)
      : Promise.resolve({ data: [] }),
    ticketOr
      ? db
          .from("tickets")
          .select("id, name, status, created_at")
          .or(ticketOr)
          .order("created_at", { ascending: false })
          .limit(8)
      : Promise.resolve({ data: [] }),
    db
      .from("safety_reports")
      .select("id, category, status, created_at, reporter_profile_id, reported_profile_id")
      .or(`reporter_profile_id.eq.${id},reported_profile_id.eq.${id}`)
      .order("created_at", { ascending: false })
      .limit(8),
    db
      .from("threads")
      .select("id, profile_a, profile_b, frozen, created_at")
      .or(`profile_a.eq.${id},profile_b.eq.${id}`)
      .order("created_at", { ascending: false })
      .limit(8),
  ]);

  const threadRows = threads.data ?? [];
  const otherIds = [
    ...new Set(
      threadRows
        .map((row) => String(row.profile_a === id ? row.profile_b : row.profile_a))
        .filter(Boolean),
    ),
  ];
  const threadIds = threadRows.map((row) => String(row.id));
  const [{ data: lastNotes }, { data: others }] = await Promise.all([
    threadIds.length
      ? db
          .from("messages")
          .select("id, thread_id, body, created_at, deleted_at")
          .in("thread_id", threadIds)
          .order("created_at", { ascending: false })
          .limit(40)
      : Promise.resolve({ data: [] }),
    otherIds.length
      ? db.from("profiles").select("id, subject_full_name, member_code").in("id", otherIds)
      : Promise.resolve({ data: [] }),
  ]);

  const otherById = new Map((others ?? []).map((row) => [String(row.id), row]));
  const notesByThread = new Map<string, typeof lastNotes>();
  for (const note of lastNotes ?? []) {
    const key = String(note.thread_id);
    const list = notesByThread.get(key) ?? [];
    if (list.length < 6) list.push(note);
    notesByThread.set(key, list);
  }

  const place = [profile.current_city, profile.current_state].filter(Boolean).join(", ");
  const plans = memberships.data ?? [];
  const livePlan = plans.find((row) => String(row.status) === "active") ?? plans[0];
  const planTitle = livePlan
    ? `${planByCode(String(livePlan.plan_code))?.name ?? String(livePlan.plan_code)} · ${String(livePlan.status)}`
    : "No membership on file";
  const ticketRows = tickets.data ?? [];
  const reportRows = reports.data ?? [];
  const ticketTitle = ticketRows.length
    ? `${ticketRows.length} house request${ticketRows.length === 1 ? "" : "s"}`
    : "No house requests";
  const safetyTitle = reportRows.length
    ? `${reportRows.length} safety report${reportRows.length === 1 ? "" : "s"}`
    : "No safety reports";
  const chatTitle = threadRows.length
    ? `${threadRows.length} conversation${threadRows.length === 1 ? "" : "s"}`
    : "No conversations";

  return (
    <section className="desk-panel desk-file">
      <header className="desk-panel-head">
        <div>
          <p className="browse-kicker">Member file</p>
          <h2>{profile.subject_full_name || "Unnamed"}</h2>
          <p className="desk-file-sub">
            {kindLabel(profile.profile_type)} · {profile.member_code || "No member ID"}
          </p>
        </div>
        <span className="desk-pill">{statusLabel(profile.status)}</span>
      </header>

      <form className="desk-file-search is-compact" action="/desk/people" method="get">
        <label>
          Find another member
          <input name="q" className={inputClass} placeholder="Name or member ID" autoComplete="off" />
        </label>
        <button className={btnGhost} type="submit">
          Search
        </button>
      </form>

      <dl className="desk-file-facts">
        <div>
          <dt>Member ID</dt>
          <dd>{profile.member_code || "—"}</dd>
        </div>
        <div>
          <dt>Mobile</dt>
          <dd>
            {profile.subject_mobile || "—"}
            <small>{profile.phone_otp_verified_at ? "Confirmed" : "Not confirmed"}</small>
          </dd>
        </div>
        <div>
          <dt>Gmail</dt>
          <dd>{owner.data?.email || "—"}</dd>
        </div>
        <div>
          <dt>Place</dt>
          <dd>{place || "—"}</dd>
        </div>
      </dl>

      <div className="desk-file-actions">
        <Link href={profileOpenHref(id, "desk")} className={btnGhost}>
          Preview profile
        </Link>
        <Link href={`/app/profiles/${id}`} className={btnGhost}>
          Edit biodata
        </Link>
        <Link href="/desk/media" className={btnGhost}>
          Media queue
        </Link>
      </div>

      <div className="desk-file-board">
        <FileCard kicker="Membership" title={planTitle} count={plans.length}>
          {plans.length ? (
            <ul>
              {plans.map((row) => (
                <li key={String(row.id)} className="desk-file-row">
                  <span>
                    <strong>{planByCode(String(row.plan_code))?.name ?? String(row.plan_code)}</strong>
                    <small>
                      {String(row.status)}
                      {row.source ? ` · ${String(row.source)}` : ""}
                      {row.ends_at ? ` · until ${formatIstDateTime(String(row.ends_at))}` : ""}
                    </small>
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p>This account has no paid or granted cover.</p>
          )}
        </FileCard>

        <FileCard kicker="House requests" title={ticketTitle} count={ticketRows.length}>
          {ticketRows.length ? (
            <ul>
              {ticketRows.map((row) => (
                <li key={String(row.id)}>
                  <Link href={`/desk/tickets?open=${row.id}`} className="desk-file-row">
                    <span>
                      <strong>{row.name || "Request"}</strong>
                      <small>
                        {ticketStatusLabel(String(row.status))} · {formatIstDateTime(String(row.created_at))}
                      </small>
                    </span>
                    <em>Open</em>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p>No notes from this Gmail or mobile.</p>
          )}
        </FileCard>

        <FileCard kicker="Safety" title={safetyTitle} count={reportRows.length}>
          {reportRows.length ? (
            <ul>
              {reportRows.map((row) => (
                <li key={String(row.id)}>
                  <Link href="/desk/safety" className="desk-file-row">
                    <span>
                      <strong>{safetyCategoryLabel(String(row.category))}</strong>
                      <small>
                        {String(row.status).replace(/_/g, " ")} · {formatIstDateTime(String(row.created_at))}
                      </small>
                    </span>
                    <em>Open</em>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p>This profile has not been named in a report.</p>
          )}
        </FileCard>

        <FileCard kicker="Conversations" title={chatTitle} count={threadRows.length}>
          {threadRows.length ? (
            <ul>
              {threadRows.map((row) => {
                const otherId = String(row.profile_a === id ? row.profile_b : row.profile_a);
                const other = otherById.get(otherId);
                const notes = notesByThread.get(String(row.id)) ?? [];
                const latest = notes[0];
                const preview = latest?.deleted_at
                  ? "Message removed"
                  : String(latest?.body ?? "").trim() || "No messages yet";
                return (
                  <li key={String(row.id)}>
                    <details className="desk-file-thread">
                      <summary className="desk-file-row">
                        <span>
                          <strong>{other?.subject_full_name || "Other profile"}</strong>
                          <small>
                            {other?.member_code ? `${other.member_code} · ` : ""}
                            {row.frozen ? "Frozen · " : ""}
                            {latest ? formatIstDateTime(String(latest.created_at)) : formatIstDateTime(String(row.created_at))}
                          </small>
                          <em className="desk-file-preview">{preview.slice(0, 120)}</em>
                        </span>
                      </summary>
                      {notes.length ? (
                        <ol className="desk-file-notes">
                          {notes.map((note) => (
                            <li key={String(note.id)}>
                              <p>{note.deleted_at ? "Message removed" : String(note.body ?? "")}</p>
                              <time>{formatIstDateTime(String(note.created_at))}</time>
                            </li>
                          ))}
                        </ol>
                      ) : (
                        <p>No messages in this conversation yet.</p>
                      )}
                    </details>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p>This member has not opened a salon thread.</p>
          )}
        </FileCard>
      </div>
    </section>
  );
}
