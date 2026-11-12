import { requireDesk } from "@/lib/desk/access";
import { orderedProfilePair } from "@/lib/desk/safety-actions";
import { safetyCategoryLabel } from "@/lib/desk/safety-cases";
import { createServiceClient } from "@/lib/supabase/server";
import { formatIstDateTime } from "@/lib/time/ist";
import { btnGhost, cardClass } from "@/lib/ui/classes";
import { profileOpenHref } from "@/lib/ui/dismiss";
import Link from "next/link";
import { notFound } from "next/navigation";

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
  const [
    memberships,
    tickets,
    reports,
    threads,
  ] = await Promise.all([
    ownerId
      ? db
          .from("memberships")
          .select("id, plan_code, status, source, ends_at, note, created_at, activated_by")
          .eq("user_id", ownerId)
          .order("created_at", { ascending: false })
          .limit(8)
      : Promise.resolve({ data: [] }),
    ticketOr
      ? db
          .from("tickets")
          .select("id, name, status, created_at, email, mobile")
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
    db.from("threads").select("id, profile_a, profile_b, frozen, created_at").or(`profile_a.eq.${id},profile_b.eq.${id}`).order("created_at", { ascending: false }).limit(6),
  ]);

  const threadIds = (threads.data ?? []).map((row) => String(row.id));
  const { data: lastNotes } = threadIds.length
    ? await db
        .from("messages")
        .select("id, thread_id, body, created_at, sender_profile_id, deleted_at")
        .in("thread_id", threadIds)
        .order("created_at", { ascending: false })
        .limit(8)
    : { data: [] };

  const place = [profile.current_city, profile.current_state].filter(Boolean).join(", ");

  return (
    <section className="desk-panel">
      <header className="desk-panel-head">
        <div>
          <p className="browse-kicker">Member file</p>
          <h2>{profile.subject_full_name || "Unnamed"}</h2>
        </div>
        <span className="desk-pill">{profile.status}</span>
      </header>
      <dl className="desk-client-facts">
        <div>
          <dt>Member ID</dt>
          <dd>{profile.member_code || profile.id}</dd>
        </div>
        <div>
          <dt>OTP mobile</dt>
          <dd>
            {profile.subject_mobile || "—"} {profile.phone_otp_verified_at ? "· confirmed" : "· not confirmed"}
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
      <p className="plans-desk-actions">
        <Link href={profileOpenHref(id, "desk")} className={btnGhost}>
          View
        </Link>
        <Link href={`/app/profiles/${id}`} className={btnGhost}>
          Edit
        </Link>
        <Link href="/desk/media" className={btnGhost}>
          Media queue
        </Link>
      </p>

      <h3 className="desk-section-title">Plans</h3>
      <ul className="desk-staff-list">
        {(memberships.data ?? []).length ? (
          (memberships.data ?? []).map((row) => (
            <li key={String(row.id)} className={`${cardClass} desk-ticket-row`}>
              <span>
                {String(row.plan_code)} · {String(row.status)} · {String(row.source)}
                {row.ends_at ? ` · until ${formatIstDateTime(String(row.ends_at))}` : ""}
              </span>
            </li>
          ))
        ) : (
          <li className="desk-empty">No paid cover on file.</li>
        )}
      </ul>

      <h3 className="desk-section-title">Tickets</h3>
      <ul className="desk-staff-list">
        {(tickets.data ?? []).length ? (
          (tickets.data ?? []).map((row) => (
            <li key={String(row.id)}>
              <Link href={`/desk/tickets?open=${row.id}`}>{String(row.name)} · {String(row.status)} · {formatIstDateTime(String(row.created_at))}</Link>
            </li>
          ))
        ) : (
          <li className="desk-empty">No contact tickets for this Gmail or mobile.</li>
        )}
      </ul>

      <h3 className="desk-section-title">Safety</h3>
      <ul className="desk-staff-list">
        {(reports.data ?? []).length ? (
          (reports.data ?? []).map((row) => (
            <li key={String(row.id)}>
              <Link href="/desk/safety">
                {safetyCategoryLabel(String(row.category))} · {String(row.status)} · {formatIstDateTime(String(row.created_at))}
              </Link>
            </li>
          ))
        ) : (
          <li className="desk-empty">No reports naming this profile.</li>
        )}
      </ul>

      <h3 className="desk-section-title">Last chat notes</h3>
      <ul className="desk-staff-list">
        {(lastNotes ?? []).length ? (
          (lastNotes ?? []).map((row) => (
            <li key={String(row.id)} className={`${cardClass} desk-ticket-row`}>
              <span className="desk-case-body">
                {row.deleted_at ? "(removed)" : String(row.body ?? "").slice(0, 280)}
              </span>
              <span className="desk-ticket-meta">{formatIstDateTime(String(row.created_at))}</span>
            </li>
          ))
        ) : (
          <li className="desk-empty">No salon notes yet.</li>
        )}
      </ul>
      {(threads.data ?? []).map((row) => {
        const other = row.profile_a === id ? row.profile_b : row.profile_a;
        const pair = orderedProfilePair(String(row.profile_a), String(row.profile_b));
        return (
          <p key={String(row.id)} className="desk-ticket-meta">
            Thread {pair.join(" · ")} {row.frozen ? "· frozen" : ""} · other {String(other)}
          </p>
        );
      })}
    </section>
  );
}
