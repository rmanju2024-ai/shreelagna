import { VoicePlayer } from "@/app/app/profiles/media-studio";
import { reviewMediaItem } from "@/app/desk/media/actions";
import { requireDesk } from "@/lib/desk/access";
import { MEDIA_REJECT_REASONS, mediaRejectLabel } from "@/lib/desk/media-review";
import { publicMediaUrl } from "@/lib/match/inbox-card";
import { createServiceClient } from "@/lib/supabase/server";
import { formatIstDateTime } from "@/lib/time/ist";
import { btnGhost, btnPrimary, cardClass, inputClass } from "@/lib/ui/classes";
import Link from "next/link";
import { profileOpenHref } from "@/lib/ui/dismiss";

function mediaKindLabel(kind: string) {
  if (kind === "audio") return "Voice";
  if (kind === "video") return "Video";
  if (kind === "photo") return "Photo";
  return kind;
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
  const { data: people } = profileIds.length
    ? await db
        .from("profiles")
        .select("id, subject_full_name, member_code, profile_type, status, is_complete")
        .in("id", profileIds)
    : { data: [] as { id: string; subject_full_name?: string | null; member_code?: string | null; profile_type?: string | null; status?: string | null; is_complete?: boolean | null }[] };
  const byId = new Map((people ?? []).map((row) => [row.id, row]));
  const changed = rows.filter((row) => {
    const person = byId.get(row.profile_id);
    if (!person) return true;
    const status = person.status ?? "";
    const newProfile = status === "pending_review" || (status === "draft" && Boolean(person.is_complete));
    return !newProfile;
  });

  return (
    <section className="desk-panel">
      <header className="desk-panel-head">
        <div>
          <p className="browse-kicker">Media</p>
          <h2>Queue</h2>
        </div>
        <p>{changed.length} pending</p>
      </header>
      <p className="desk-profile-queue-note">
        Voice, video, or a photograph changed on a live profile. New profiles stay on the profile review queue.
      </p>
      {changed.length ? (
        <ul className="desk-media-grid">
          {changed.map((row) => {
            const person = byId.get(row.profile_id);
            const url = publicMediaUrl(row.storage_path);
            return (
              <li key={row.id} className={`${cardClass} desk-media-card`}>
                {row.kind === "photo" && url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={url} alt="" className="desk-media-shot" />
                ) : url && row.kind === "video" ? (
                  <video src={url} controls className="desk-media-shot" />
                ) : url && row.kind === "audio" ? (
                  <VoicePlayer src={url} />
                ) : (
                  <p className="desk-empty">No preview</p>
                )}
                <p className="desk-ticket-name">{person?.subject_full_name || "Unnamed"}</p>
                <p className="desk-ticket-meta">
                  {person?.member_code || row.profile_id} · {mediaKindLabel(row.kind)} · {formatIstDateTime(row.created_at)}
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
                  <span className="plans-desk-actions">
                    <button name="decision" value="approved" className={btnPrimary}>
                      Approve
                    </button>
                    <button name="decision" value="rejected" className={btnGhost}>
                      Reject
                    </button>
                    {row.kind !== "photo" ? (
                      <button name="decision" value="pending" className={btnGhost}>
                        Keep on hold
                      </button>
                    ) : null}
                  </span>
                </form>
                <Link href={profileOpenHref(row.profile_id, "desk")} className={btnGhost}>
                  Preview
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="desk-empty">No changed voice, video, or photographs are waiting. New profiles stay on the profile review queue.</p>
      )}
    </section>
  );
}
