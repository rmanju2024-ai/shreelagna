import Link from "next/link";
import { PageHero } from "@/components/page-hero";
import { after } from "next/server";
import { ChatAvatar } from "@/app/app/chat/chat-avatar";
import { PageShell } from "@/components/site-chrome";
import { ensureAppUser, getAuth } from "@/lib/auth/session";
import { alertHeadline, alertWhen } from "@/lib/match/alert-copy";
import { collapseNotices } from "@/lib/match/collapse-notices";
import { publicMediaUrl } from "@/lib/match/inbox-card";
import { createServiceClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function AlertsPage() {
  const { supabase, user } = await getAuth();
  if (!supabase || !user) redirect("/login?next=/app/alerts");
  const me = await ensureAppUser(supabase, user);
  if (!me) redirect("/login?error=account");

  if (me.active_profile_id) {
    const { recordMatchNotices } = await import("@/lib/match/notices");
    await recordMatchNotices(supabase, me.active_profile_id, me.id);
  }

  const { data: notices } = await supabase
    .from("notices")
    .select("id, kind, title, body, href, created_at, read_at, match_profile_id")
    .eq("user_id", me.id)
    .neq("kind", "chat")
    .order("created_at", { ascending: false })
    .limit(50);

  const alerts = collapseNotices(notices ?? []);
  const profileIds = [...new Set(alerts.map((row) => row.match_profile_id).filter(Boolean))] as string[];
  const photoMap = new Map<string, string>();
  if (profileIds.length) {
    const media = createServiceClient() ?? supabase;
    const { data: photos } = await media
      .from("media")
      .select("profile_id, storage_path, created_at")
      .eq("kind", "photo")
      .in("profile_id", profileIds)
      .order("created_at");
    for (const row of photos ?? []) {
      if (!photoMap.has(row.profile_id) && row.storage_path) photoMap.set(row.profile_id, row.storage_path);
    }
  }

  after(async () => {
    await supabase
      .from("notices")
      .update({ read_at: new Date().toISOString() })
      .eq("user_id", me.id)
      .neq("kind", "chat")
      .is("read_at", null);
  });

  return (
    <PageShell>
      <div className="sx-stage">
      <PageHero kicker="Activity" title="Alerts" sub="Matches, views and replies in one place." stat={{ value: alerts.length, label: "Recent" }} />
      <ul className="alert-list">
        {alerts.map((note) => {
          const unread = !note.read_at;
          const { name, detail } = alertHeadline(note.kind, note.title, note.body);
          const inner = (
            <>
              <ChatAvatar name={name} src={publicMediaUrl(photoMap.get(note.match_profile_id ?? ""))} />
              <span className="alert-copy">
                <span className="alert-line">
                  <b>{name}</b> {detail}
                </span>
                <time dateTime={note.created_at}>{alertWhen(note.created_at)}</time>
              </span>
              {unread ? <span className="alert-dot" aria-label="Unread" /> : null}
            </>
          );
          return (
            <li key={note.id}>
              {note.href ? (
                <Link href={note.href} className={`alert-card${unread ? " is-new" : ""}`}>
                  {inner}
                </Link>
              ) : (
                <div className={`alert-card${unread ? " is-new" : ""}`}>{inner}</div>
              )}
            </li>
          );
        })}
      </ul>
      {!alerts.length ? (
        <div className="sx-empty">
          <h3>No alerts yet</h3>
        </div>
      ) : null}
      </div>
    </PageShell>
  );
}
