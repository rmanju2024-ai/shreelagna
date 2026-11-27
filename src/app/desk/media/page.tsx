import { reviewMediaItem } from "@/app/desk/media/actions";
import { requireDesk } from "@/lib/desk/access";
import { MEDIA_REJECT_REASONS, mediaRejectLabel } from "@/lib/desk/media-review";
import { createServiceClient } from "@/lib/supabase/server";
import { formatIstDateTime } from "@/lib/time/ist";
import { btnGhost, btnPrimary, cardClass, inputClass } from "@/lib/ui/classes";
import Link from "next/link";
import { profileOpenHref } from "@/lib/ui/dismiss";

function mediaKindLabel(kind: string) {
  if (kind === "audio") return "Voice";
  if (kind === "video") return "Video";
  if (kind === "photo") return "Photo";
  return "File";
}

type MediaRow = {
  id: string;
  profile_id: string;
  kind: string;
  status: string;
  storage_path: string;
  review_reason?: string | null;
  created_at: string;
};

type Person = {
  id: string;
  subject_full_name?: string | null;
  member_code?: string | null;
  status?: string | null;
};

export default async function DeskMediaPage() {
  const desk = await requireDesk("/desk/media");
  if (!desk.allowed) return null;
  const db = createServiceClient() ?? desk.supabase;
  const pending = await db
    .from("media")
    .select("id, profile_id, kind, status, storage_path, review_reason, created_at")
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .limit(80);
  const rows = ((pending.error ? [] : pending.data) ?? []) as MediaRow[];
  const profileIds = [...new Set(rows.map((row) => row.profile_id))];
  const peopleResult = profileIds.length
    ? await db.from("profiles").select("id, subject_full_name, member_code, status").in("id", profileIds)
    : { data: [] as Person[], error: null };
  const people = ((peopleResult.error ? [] : peopleResult.data) ?? []) as Person[];
  const byId = new Map(people.map((row) => [row.id, row]));
  const changed = peopleResult.error
    ? []
    : rows.filter((row) => byId.get(row.profile_id)?.status === "active");

  return (
    <section className="desk-panel">
      <header className="desk-panel-head">
        <div>
          <p className="browse-kicker">Media</p>
          <h2>Changes</h2>
        </div>
        <p>{changed.length} pending</p>
      </header>
      <p className="desk-profile-queue-note">
        A live profile sent a new photo, voice, or video after the first review. New profiles stay on the profile queue.
      </p>
      {changed.length ? (
        <ul className="desk-media-grid">
          {changed.map((row) => {
            const person = byId.get(row.profile_id);
            const kind = mediaKindLabel(row.kind);
            return (
              <li key={row.id} className={`${cardClass} desk-media-card`}>
                <p className="desk-media-change">{kind} came for review</p>
                <p className="desk-ticket-name">{person?.subject_full_name || "Unnamed"}</p>
                <p className="desk-ticket-meta">
                  {person?.member_code || row.profile_id} · {formatIstDateTime(row.created_at)}
                </p>
                {row.review_reason ? <p className="desk-ticket-flags">{mediaRejectLabel(row.review_reason)}</p> : null}
                <form action={reviewMediaItem} className="desk-media-tools">
                  <input type="hidden" name="id" value={row.id} />
                  <label className="desk-ticket-note-label">
                    If rejecting
                    <select name="reason" className={inputClass} defaultValue="blur">
                      {MEDIA_REJECT_REASONS.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <span className="desk-media-actions">
                    <button name="decision" value="approved" className={btnPrimary}>
                      Approve
                    </button>
                    <button name="decision" value="rejected" className={btnGhost}>
                      Reject
                    </button>
                  </span>
                  {row.kind !== "photo" ? (
                    <button name="decision" value="pending" className={`${btnGhost} desk-media-hold`}>
                      Keep on hold
                    </button>
                  ) : null}
                </form>
                <Link href={profileOpenHref(row.profile_id, "desk")} className="desk-media-preview">
                  Open profile to check the {kind.toLowerCase()}
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="desk-empty">No changes from live profiles. New profiles stay on the profile queue.</p>
      )}
    </section>
  );
}
