import { safetyCategoryLabel } from "@/lib/desk/safety-cases";
import { ticketStatusLabel } from "@/lib/desk/tickets";
import { planByCode, WELCOME_PLAN_NAME } from "@/lib/membership/catalog";
import { loadMembership } from "@/lib/membership/load";
import { effectiveInterestStatus } from "@/lib/match/interest-status";
import { publicMediaUrl } from "@/lib/match/inbox-card";
import { formatIstDate, formatIstDateTime } from "@/lib/time/ist";
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

function planStatusLabel(status: string) {
  if (status === "pending") return "Waiting for payment";
  if (status === "active") return "Live";
  if (status === "declined") return "Declined";
  if (status === "cancelled") return "Cancelled";
  if (status === "expired") return "Ended";
  return status.replace(/_/g, " ");
}

function planSourceLabel(source: string) {
  if (source === "grant") return "Staff grant";
  if (source === "request") return "Payment request";
  if (source === "welcome") return WELCOME_PLAN_NAME;
  return source.replace(/_/g, " ");
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
      "id, member_code, subject_full_name, status, profile_type, created_by, created_at, subject_mobile, phone_otp_verified_at, current_city, current_state, last_seen_at",
    )
    .eq("id", id)
    .maybeSingle();
  if (!profile) return <p className="desk-empty">This profile is no longer on file.</p>;

  const ownerId = String(profile.created_by ?? "");
  const owner = ownerId
    ? await db
        .from("app_users")
        .select("id, email, display_name, role, welcome_started_at, welcome_days, last_seen_at")
        .eq("id", ownerId)
        .maybeSingle()
    : { data: null as { email?: string | null; last_seen_at?: string | null } | null };
  const ticketOr = [
    profile.subject_mobile ? `mobile.eq.${profile.subject_mobile}` : "",
    owner.data?.email ? `email.eq.${owner.data.email}` : "",
  ]
    .filter(Boolean)
    .join(",");
  const [memberships, tickets, reports, media, interestRows, threadRows] = await Promise.all([
    ownerId
      ? db
          .from("memberships")
          .select("id, plan_code, status, source, ends_at, starts_at, created_at, note")
          .eq("user_id", ownerId)
          .order("created_at", { ascending: false })
          .limit(20)
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
    db
      .from("interests")
      .select("id, status, created_at, from_profile_id, to_profile_id")
      .or(`from_profile_id.eq.${id},to_profile_id.eq.${id}`),
    db.from("threads").select("id").or(`profile_a.eq.${id},profile_b.eq.${id}`),
  ]);

  const place = [profile.current_city, profile.current_state].filter(Boolean).join(", ");
  const plans = memberships.data ?? [];
  const access = owner.data
    ? await loadMembership(db, {
        id: ownerId,
        role: (owner.data as { role?: string | null }).role,
        welcome_started_at: (owner.data as { welcome_started_at?: string | null }).welcome_started_at,
        welcome_days: (owner.data as { welcome_days?: number | null }).welcome_days,
      })
    : null;
  const waiting = plans.find((row: { status?: string | null }) => String(row.status) === "pending");
  const currentPlan =
    access?.kind === "house"
      ? access.label
      : access?.kind === "paid"
        ? access.label.replace(/\s+plan$/i, "")
        : access?.kind === "welcome"
          ? WELCOME_PLAN_NAME
          : "No live plan";
  const currentHint = access?.live
    ? access.until
      ? `${access.daysLeft} days left · until ${formatIstDate(access.until)}`
      : "House access"
    : waiting
      ? `${planByCode(String(waiting.plan_code))?.name ?? waiting.plan_code} waiting for payment`
      : "No live cover";

  const interests = interestRows.data ?? [];
  const statuses = interests.map((row: { status?: string | null; created_at?: string | null }) =>
    effectiveInterestStatus(row.status, row.created_at ?? ""),
  );
  const sent = interests.filter((row: { from_profile_id: string }) => row.from_profile_id === id).length;
  const received = interests.filter((row: { to_profile_id: string }) => row.to_profile_id === id).length;
  const accepted = statuses.filter((status: string) => status === "accepted").length;
  const declined = statuses.filter((status: string) => status === "declined").length;
  const pending = statuses.filter((status: string) => status === "pending").length;
  const chats = (threadRows.data ?? []).length;
  const lastSeen = profile.last_seen_at || owner.data?.last_seen_at || null;

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
            <Image
              src={photoUrl}
              alt={profile.subject_full_name || "Profile photo"}
              fill
              sizes="96px"
              quality={55}
              style={{ objectFit: "cover", objectPosition: "center 18%" }}
            />
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
        <div className="is-plan">
          <dt>Current membership</dt>
          <dd>
            {currentPlan}
            <small>
              {access?.live ? "Live" : "Not live"}
              {currentHint ? ` · ${currentHint}` : ""}
            </small>
          </dd>
        </div>
      </dl>

      <div className="desk-file-actions">
        <Link href={join("peek=profile")} className={btnGhost} scroll={false}>
          Preview profile
        </Link>
        <Link href={join("peek=inbox")} className={btnGhost} scroll={false}>
          Preview inbox
        </Link>
        <Link href={join("peek=edit")} className={btnGhost} scroll={false}>
          Edit biodata
        </Link>
      </div>

      <section className="desk-file-panel">
        <header className="desk-file-panel-head">
          <div>
            <h3>Plan history</h3>
            <p>Payment requests, grants, and cancels.</p>
          </div>
        </header>
        <div className="desk-file-panel-body">
          {plans.length ? (
            <ul>
              {plans.map(
                (row: {
                  id: string;
                  plan_code?: string;
                  status?: string;
                  source?: string;
                  ends_at?: string | null;
                  created_at?: string | null;
                  note?: string | null;
                }) => (
                  <li key={String(row.id)} className="desk-file-row">
                    <span>
                      <strong>{planByCode(String(row.plan_code))?.name ?? String(row.plan_code)}</strong>
                      <small>
                        {planStatusLabel(String(row.status ?? ""))}
                        {row.source ? ` · ${planSourceLabel(String(row.source))}` : ""}
                        {row.created_at ? ` · ${formatIstDateTime(String(row.created_at))}` : ""}
                        {row.ends_at ? ` · until ${formatIstDateTime(String(row.ends_at))}` : ""}
                        {row.note ? ` · ${String(row.note)}` : ""}
                      </small>
                    </span>
                    <em>{planStatusLabel(String(row.status ?? ""))}</em>
                  </li>
                ),
              )}
            </ul>
          ) : (
            <p className="desk-file-muted">No payment requests, grants, or plan changes yet.</p>
          )}
        </div>
      </section>

      <section className="desk-file-panel">
        <header className="desk-file-panel-head">
          <div>
            <p className="desk-file-kicker">Activity</p>
            <h3>Profile statistics</h3>
          </div>
        </header>
        <ul className="desk-file-stats">
          <li>
            <span>Last login</span>
            <strong>{lastSeen ? formatIstDateTime(String(lastSeen)) : "Never"}</strong>
          </li>
          <li>
            <span>Joined</span>
            <strong>{profile.created_at ? formatIstDate(new Date(String(profile.created_at))) : "—"}</strong>
          </li>
          <li>
            <span>Chats</span>
            <strong>{chats}</strong>
          </li>
          <li>
            <span>Connected</span>
            <strong>{accepted}</strong>
          </li>
          <li>
            <span>Interests sent</span>
            <strong>{sent}</strong>
          </li>
          <li>
            <span>Interests received</span>
            <strong>{received}</strong>
          </li>
          <li>
            <span>Pending</span>
            <strong>{pending}</strong>
          </li>
          <li>
            <span>Declined</span>
            <strong>{declined}</strong>
          </li>
        </ul>
      </section>

      <section className="desk-file-panel">
        <header className="desk-file-panel-head">
          <div>
            <p className="desk-file-kicker">House requests</p>
            <h3>{ticketRows.length ? `${ticketRows.length} on file` : "None"}</h3>
          </div>
        </header>
        <div className="desk-file-panel-body">
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
            <p className="desk-file-muted">No notes from this Gmail or mobile.</p>
          )}
        </div>
      </section>

      <section className="desk-file-panel">
        <header className="desk-file-panel-head">
          <div>
            <p className="desk-file-kicker">Safety</p>
            <h3>{reportRows.length ? `${reportRows.length} report${reportRows.length === 1 ? "" : "s"}` : "No reports"}</h3>
          </div>
        </header>
        <div className="desk-file-panel-body">
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
            <p className="desk-file-muted">This profile has not been named in a report.</p>
          )}
        </div>
      </section>
    </div>
  );
}
