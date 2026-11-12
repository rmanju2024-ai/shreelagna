import { reviewMediaItem } from "@/app/desk/media/actions";
import { requireDesk } from "@/lib/desk/access";
import { MEDIA_REJECT_REASONS, mediaRejectLabel } from "@/lib/desk/media-review";
import { publicMediaUrl } from "@/lib/match/inbox-card";
import { createServiceClient } from "@/lib/supabase/server";
import { formatIstDateTime } from "@/lib/time/ist";
import { btnGhost, btnPrimary, cardClass, inputClass } from "@/lib/ui/classes";
import Link from "next/link";
import { profileOpenHref } from "@/lib/ui/dismiss";

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
        .select("id, subject_full_name, member_code, profile_type, status")
        .in("id", profileIds)
    : { data: [] as { id: string; subject_full_name?: string | null; member_code?: string | null; profile_type?: string | null; status?: string | null }[] };
  const byId = new Map((people ?? []).map((row) => [row.id, row]));

  return (
    <section className="desk-panel">
      <header className="desk-panel-head">
        <div>
          <p className="browse-kicker">Photo & intro</p>
          <h2>Media waiting</h2>
        </div>
        <p>{rows.length} pending</p>
      </header>
      <p className="desk-profile-queue-note">
        Approve a photograph, or reject one file without taking the whole profile down. Hold video or voice on its own.
      </p>
      {rows.length ? (
        <ul className="desk-media-grid">
          {rows.map((row) => {
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
                  <audio src={url} controls className="desk-media-audio" />
                ) : (
                  <p className="desk-empty">No preview</p>
                )}
                <p className="desk-ticket-name">{person?.subject_full_name || "Unnamed"}</p>
                <p className="desk-ticket-meta">
                  {person?.member_code || row.profile_id} · {row.kind} · {formatIstDateTime(row.created_at)}
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
                  View profile
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="desk-empty">No photographs or intros are waiting. New member uploads land here as pending.</p>
      )}
    </section>
  );
}
