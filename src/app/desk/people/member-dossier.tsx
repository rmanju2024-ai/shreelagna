import type { ReactNode } from "react";
import { safetyCategoryLabel } from "@/lib/desk/safety-cases";
import { ticketStatusLabel } from "@/lib/desk/tickets";
import { planByCode } from "@/lib/membership/catalog";
import { publicMediaUrl } from "@/lib/match/inbox-card";
import { formatIstDateTime } from "@/lib/time/ist";
import { btnGhost } from "@/lib/ui/classes";
import Image from "next/image";
import Link from "next/link";

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

export async function MemberDossier({
  db,
  id,
  fileHref,
}: {
  db: { from: (table: string) => any };
  id: string;
  fileHref: string;
}) {
  const { data: profile } = await db
    .from("profiles")
    .select(
      "id, member_code, subject_full_name, status, profile_type, created_by, created_at, subject_mobile, phone_otp_verified_at, current_city, current_state",
    )
    .eq("id", id)
    .maybeSingle();
  if (!profile) return <p className="desk-empty">This profile is no longer on file.</p>;

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
  const [memberships, tickets, reports, media] = await Promise.all([
    ownerId
      ? db
          .from("memberships")
          .select("id, plan_code, status, source, ends_at, created_at")
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
      .select("id, category, status, created_at")
      .or(`reporter_profile_id.eq.${id},reported_profile_id.eq.${id}`)
      .order("created_at", { ascending: false })
      .limit(8),
    db
      .from("media")
      .select("storage_path, is_primary, status")
      .eq("profile_id", id)
      .eq("kind", "photo")
      .order("created_at"),
  ]);

  const place = [profile.current_city, profile.current_state].filter(Boolean).join(", ");
  const plans = memberships.data ?? [];
  const livePlan = plans.find((row: { status?: string | null }) => String(row.status) === "active") ?? plans[0];
  const planTitle = livePlan
    ? `${planByCode(String(livePlan.plan_code))?.name ?? String(livePlan.plan_code)} · ${String(livePlan.status)}`
    : "No membership on file";
  const ticketRows = tickets.data ?? [];
  const reportRows = reports.data ?? [];
  const photos = media.data ?? [];
  const primary =
    photos.find((row: { is_primary?: boolean | null }) => row.is_primary) ??
    photos.find((row: { status?: string | null }) => row.status === "approved") ??
    photos[0];
  const photoUrl = publicMediaUrl(primary?.storage_path);
  const join = (extra: string) => (fileHref.includes("?") ? `${fileHref}&${extra}` : `${fileHref}?${extra}`);

  return (
    <div className="desk-file desk-file-dossier">
      <header className="desk-panel-head desk-file-id">
        <span className="desk-file-photo">
          {photoUrl ? (
            <Image src={photoUrl} alt={profile.subject_full_name || "Profile photo"} fill sizes="96px" quality={55} style={{ objectFit: "cover", objectPosition: "center 18%" }} />
          ) : (
            <em>{(profile.subject_full_name || "?").slice(0, 1)}</em>
          )}
        </span>
        <div>
          <p className="browse-kicker">Member file</p>
          <h2>{profile.subject_full_name || "Unnamed"}</h2>
          <p className="desk-file-sub">
            {kindLabel(profile.profile_type)} · {profile.member_code || "No member ID"}
          </p>
        </div>
        <span className="desk-pill">{statusLabel(profile.status)}</span>
      </header>

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
        <Link href={join("peek=profile")} className={btnGhost} scroll={false}>
          Preview profile
        </Link>
        <Link href={join("peek=inbox")} className={btnGhost} scroll={false}>
          Preview inbox
        </Link>
        <Link href={`/app/profiles/${id}`} className={btnGhost}>
          Edit biodata
        </Link>
      </div>

      <div className="desk-file-board">
        <FileCard kicker="Membership" title={planTitle} count={plans.length}>
          {plans.length ? (
            <ul>
              {plans.map((row: { id: string; plan_code?: string; status?: string; source?: string; ends_at?: string | null }) => (
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

        <FileCard
          kicker="House requests"
          title={ticketRows.length ? `${ticketRows.length} house request${ticketRows.length === 1 ? "" : "s"}` : "No house requests"}
          count={ticketRows.length}
        >
          {ticketRows.length ? (
            <ul>
              {ticketRows.map((row: { id: string; name?: string | null; status?: string | null; created_at?: string }) => (
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

        <FileCard
          kicker="Safety"
          title={reportRows.length ? `${reportRows.length} safety report${reportRows.length === 1 ? "" : "s"}` : "No safety reports"}
          count={reportRows.length}
        >
          {reportRows.length ? (
            <ul>
              {reportRows.map((row: { id: string; category?: string | null; status?: string | null; created_at?: string }) => (
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
      </div>
    </div>
  );
}
