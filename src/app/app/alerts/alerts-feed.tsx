import { loadBlockedProfileIds } from "@/lib/safety/blocked";
import Link from "next/link";
import { after } from "next/server";
import { ChatAvatar } from "@/app/app/chat/chat-avatar";
import { ensureAppUser, getAuth } from "@/lib/auth/session";
import { alertHeadline, alertWhen } from "@/lib/match/alert-copy";
import { collapseNotices, noticesForActiveProfiles } from "@/lib/match/collapse-notices";
import { publicMediaUrl } from "@/lib/match/inbox-card";
import { createServiceClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

const alertStyle = (kind: string) => {
  if (kind === "interest_received") return { icon: "💌", tone: "interest" };
  if (kind === "interest_accepted") return { icon: "✨", tone: "accepted" };
  if (kind === "profile_view") return { icon: "👀", tone: "view" };
  if (kind === "contact_view") return { icon: "📇", tone: "contact" };
  if (kind === "match") return { icon: "💫", tone: "match" };
  return { icon: "🔔", tone: "general" };
};

/** Activity feed used by the Alerts page and the Inbox Alerts tab. */
export async function AlertsFeed() {
  const { supabase, user } = await getAuth();
  if (!supabase || !user) redirect("/login?next=/app/alerts");
  const me = await ensureAppUser(supabase, user);
  if (!me) redirect("/login?error=account");
  if (me.active_profile_id) {
    // Scanning for new matches is slow; do it after the page is sent so Alerts opens at once.
    const profileId = me.active_profile_id;
    after(async () => {
      try {
        const { recordMatchNotices } = await import("@/lib/match/notices");
        await recordMatchNotices(supabase, profileId, me.id);
      } catch {
        /* a missed scan is retried on the next visit */
      }
    });
  }
  const { data: notices } = await supabase.from("notices").select("id, kind, title, body, href, created_at, read_at, match_profile_id").eq("user_id", me.id).neq("kind", "chat").order("created_at", { ascending: false }).limit(50);
  const collapsed = collapseNotices(notices ?? []);
  const profileIds = [...new Set(collapsed.map((row) => row.match_profile_id).filter(Boolean))] as string[];
  const media = createServiceClient() ?? supabase;
  // Independent lookups run together instead of one after another.
  const [{ data: visibleProfiles }, { data: photos }] = profileIds.length
    ? await Promise.all([
        supabase.from("profiles").select("id").in("id", profileIds).eq("status", "active"),
        media.from("media").select("profile_id, storage_path, created_at").eq("kind", "photo").eq("status", "approved").in("profile_id", profileIds).order("created_at"),
      ])
    : [{ data: [] as { id: string }[] }, { data: [] as { profile_id: string; storage_path: string | null }[] }];
  const blocked = await loadBlockedProfileIds(media, me.active_profile_id ? [me.active_profile_id] : []);
  const alerts = noticesForActiveProfiles(
    collapsed,
    new Set((visibleProfiles ?? []).map((row) => row.id).filter((id) => !blocked.has(id))),
  );
  const photoMap = new Map<string, string>();
  for (const row of photos ?? []) if (!photoMap.has(row.profile_id) && row.storage_path) photoMap.set(row.profile_id, row.storage_path);
  const readAt = new Date().toISOString();
  // Marking as read happens after the page is sent; it is scoped to this member and never blocks the view.
  after(async () => {
    await media.from("notices").update({ read_at: readAt }).eq("user_id", me.id).neq("kind", "chat").is("read_at", null);
  });
  const shownAlerts = alerts; // unread ones stay highlighted this visit
  return (
    <div className="alerts-genz inbox-alerts">
      {shownAlerts.length ? <p className="alerts-genz-hint">Everything here is private to you. Tap an update to see what’s next.</p> : null}
      <ul className="alert-list alerts-genz-list">
        {shownAlerts.map((note) => {
          const unread = !note.read_at;
          const { name, detail } = alertHeadline(note.kind, note.title, note.body);
          const style = alertStyle(note.kind);
          const inner = <><span className={`alerts-genz-icon is-${style.tone}`} aria-hidden>{style.icon}</span><ChatAvatar name={name} src={publicMediaUrl(photoMap.get(note.match_profile_id ?? ""))} /><span className="alert-copy"><span className="alert-line"><b>{name}</b> {detail}</span><span className="alerts-genz-meta"><time dateTime={note.created_at}>{alertWhen(note.created_at)}</time><span>Open →</span></span></span>{unread ? <span className="alert-dot" aria-label="Unread" /> : null}</>;
          return <li key={note.id}>{note.href ? <Link href={note.href} className={`alert-card${unread ? " is-new" : ""}`}>{inner}</Link> : <div className={`alert-card${unread ? " is-new" : ""}`}>{inner}</div>}</li>;
        })}
      </ul>
      {!shownAlerts.length ? <div className="sx-empty alerts-genz-empty"><span aria-hidden>✨</span><div><h3>You’re all caught up</h3><p>New matches and profile activity will show up here.</p></div></div> : null}
    </div>
  );
}
