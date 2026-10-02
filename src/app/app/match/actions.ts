"use server";

import { ensureAppUser } from "@/lib/auth/session";
import { writeAudit } from "@/lib/desk/audit";
import { notifyInterestAccepted } from "@/lib/notify/dispatch";
import { missingPayloadColumn, isMissingColumnError } from "@/lib/profile/db-errors";
import { chatReceivedCopy, interestAcceptedCopy, interestDeclinedCopy } from "@/lib/match/alert-copy";
import { canAlertInterest } from "@/lib/match/profile-settings";
import { orderedProfilePair, pairCanChat, isStalePending, trimDeclineReason } from "@/lib/match/interest-status";
import { pairPlanLive } from "@/lib/membership/access";
import { loadMembership, loadMembershipForProfile } from "@/lib/membership/load";
import { displayFirstName } from "@/lib/profile/options";
import { previewText } from "@/lib/match/chat-ui";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { readSessionFromCookies } from "@/lib/supabase/user-rest";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

async function requireMember() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/app");
  const cookieSession = await readSessionFromCookies();
  if (cookieSession) await supabase.auth.setSession(cookieSession);
  const me = await ensureAppUser(supabase, user);
  if (!me) redirect("/login?error=account");
  const admin = createServiceClient();
  return { supabase: admin ?? supabase, me };
}

function orderedPair(a: string, b: string): [string, string] {
  return orderedProfilePair(a, b);
}

export async function expireStaleInterests() {
  const { supabase } = await requireMember();
  const rpc = await supabase.rpc("expire_stale_interests");
  if (!rpc.error) return;
  const { data } = await supabase.from("interests").select("id, created_at, status").eq("status", "pending");
  const stale = (data ?? []).filter((row) => isStalePending(row.created_at));
  if (!stale.length) return;
  await supabase
    .from("interests")
    .update({ status: "expired", responded_at: new Date().toISOString() })
    .in(
      "id",
      stale.map((row) => row.id),
    );
}

export async function respondInterest(formData: FormData) {
  const { supabase, me } = await requireMember();
  const id = String(formData.get("interest_id") ?? "");
  const next = String(formData.get("decision") ?? "");
  if (!id || (next !== "accepted" && next !== "declined")) redirect("/app/interests");

  const { data: row } = await supabase
    .from("interests")
    .select("id, from_profile_id, to_profile_id, status, created_at")
    .eq("id", id)
    .maybeSingle();
  if (!row) redirect("/app/interests");

  const { data: mine } = await supabase
    .from("profiles")
    .select("id, status, subject_full_name")
    .eq("created_by", me.id)
    .eq("id", row.to_profile_id)
    .maybeSingle();
  if (!mine || mine.status !== "active") redirect("/app/interests");
  let { data: other } = await supabase
    .from("profiles")
    .select("id, status, created_by, subject_full_name, notify_interest")
    .eq("id", row.from_profile_id)
    .maybeSingle();
  if (!other) {
    const retry = await supabase
      .from("profiles")
      .select("id, status, created_by, subject_full_name")
      .eq("id", row.from_profile_id)
      .maybeSingle();
    other = retry.data as typeof other;
  }
  if (!other || other.status !== "active") redirect("/app/interests");

  if (isStalePending(row.created_at)) {
    await supabase
      .from("interests")
      .update({ status: "expired", responded_at: new Date().toISOString() })
      .eq("id", id);
    revalidatePath("/app/interests");
    redirect("/app/interests");
  }

  const reason = next === "declined" ? trimDeclineReason(formData.get("reason")) : null;
  const payload: Record<string, unknown> = { status: next, responded_at: new Date().toISOString() };
  if (next === "declined") payload.decline_reason = reason;
  const { error } = await supabase.from("interests").update(payload).eq("id", id);
  if (error && missingPayloadColumn(error, payload)) {
    const retry = { status: next, responded_at: payload.responded_at };
    const again = await supabase.from("interests").update(retry).eq("id", id);
    if (again.error) {
      revalidatePath("/app/interests");
      redirect("/app/interests?error=sql");
    }
  }

  if (next === "accepted") {
    const [a, b] = orderedPair(row.from_profile_id, row.to_profile_id);
    await supabase.from("threads").insert({ profile_a: a, profile_b: b });
    const { data: thread } = await supabase
      .from("threads")
      .select("id")
      .eq("profile_a", a)
      .eq("profile_b", b)
      .maybeSingle();
    const copy = interestAcceptedCopy(
      displayFirstName(other.subject_full_name ?? "there"),
      displayFirstName(mine.subject_full_name ?? "A member"),
    );
    if (canAlertInterest(other)) {
      await supabase.from("notices").insert({
        user_id: other.created_by,
        kind: copy.kind,
        title: copy.title,
        body: copy.body,
        href: thread?.id ? `/app/chat/${thread.id}` : "/app/chat",
        match_profile_id: mine.id,
      });
      await notifyInterestAccepted(
        other.created_by,
        displayFirstName(mine.subject_full_name ?? "A member"),
      );
    }
  }

  if (next === "declined") {
    const copy = interestDeclinedCopy(
      displayFirstName(other.subject_full_name ?? "there"),
      displayFirstName(mine.subject_full_name ?? "A member"),
      reason,
    );
    if (canAlertInterest(other)) {
      await supabase.from("notices").insert({
        user_id: other.created_by,
        kind: copy.kind,
        title: copy.title,
        body: copy.body,
        href: "/app/interests",
        match_profile_id: mine.id,
      });
    }
  }

  await writeAudit({
    actorUserId: me.id,
    actorRole: me.role,
    action: next === "accepted" ? "interest.accepted" : "interest.declined",
    entityType: "interest",
    entityId: id,
    metadata: { from: row.from_profile_id, to: row.to_profile_id },
  });
  revalidatePath("/app/interests");
  revalidatePath("/app/chat");
  revalidatePath("/app/alerts");
  revalidatePath("/", "layout");
  redirect(next === "accepted" ? "/app/chat" : "/app/interests");
}

export async function savePrivacy(formData: FormData) {
  await saveProfileSettings(formData);
}

export async function saveProfileSettings(formData: FormData) {
  const { supabase, me } = await requireMember();
  const profileId = String(formData.get("profile_id") ?? "");
  if (!profileId) redirect("/app");
  const { data: mine } = await supabase
    .from("profiles")
    .select("id, status")
    .eq("id", profileId)
    .eq("created_by", me.id)
    .maybeSingle();
  if (!mine) redirect("/app");
  const paused = formData.get("pause_profile") === "on";
  const payload: Record<string, unknown> = {
    hide_last_seen: formData.get("hide_last_seen") === "on",
    hide_photo_until_accept: formData.get("hide_photo_until_accept") === "on",
    notify_profile_views: formData.get("notify_profile_views") === "on",
    notify_interest: formData.get("notify_interest") === "on",
  };
  if (mine.status === "active" || mine.status === "hidden") {
    payload.status = paused ? "hidden" : "active";
  }
  let { error } = await supabase.from("profiles").update(payload).eq("id", profileId);
  while (error && missingPayloadColumn(error, payload)) {
    delete payload[missingPayloadColumn(error, payload)!];
    const again = await supabase.from("profiles").update(payload).eq("id", profileId);
    error = again.error;
  }
  const mail: Record<string, unknown> = {
    notify_match_email: formData.get("notify_match_email") === "on",
    notify_whatsapp: formData.get("notify_whatsapp") === "on",
  };
  let emailUpdate = await supabase.from("app_users").update(mail).eq("id", me.id);
  while (emailUpdate.error && missingPayloadColumn(emailUpdate.error, mail)) {
    delete mail[missingPayloadColumn(emailUpdate.error, mail)!];
    emailUpdate = await supabase.from("app_users").update(mail).eq("id", me.id);
  }
  revalidatePath(`/app/profiles/${profileId}`);
  revalidatePath("/app/settings");
  revalidatePath("/browse");
  revalidatePath("/", "layout");
  redirect("/app/settings");
}

export async function sendChat(formData: FormData) {
  const posted = await postChatMessage(formData);
  redirect(posted.bounce);
}

export async function sendPeekChat(formData: FormData) {
  return postChatMessage(formData);
}

export async function markPeekRead(formData: FormData) {
  const { supabase, me } = await requireMember();
  const threadId = String(formData.get("thread_id") ?? "");
  const toId = String(formData.get("to_profile_id") ?? "");
  if (!threadId || !me.active_profile_id) return { ok: false };
  const now = new Date().toISOString();
  const update = await supabase
    .from("messages")
    .update({ read_at: now })
    .eq("thread_id", threadId)
    .neq("sender_profile_id", me.active_profile_id)
    .is("read_at", null);
  if (update.error && !isMissingColumnError(update.error, "read_at")) {
    return { ok: false };
  }
  await supabase
    .from("notices")
    .update({ read_at: now })
    .eq("user_id", me.id)
    .eq("kind", "chat")
    .is("read_at", null);
  if (toId) revalidatePath(`/browse/${toId}`);
  revalidatePath("/app/alerts");
  return { ok: true };
}

async function postChatMessage(formData: FormData) {
  const { supabase, me } = await requireMember();
  const next = String(formData.get("next") ?? "").trim();
  const toId = String(formData.get("to_profile_id") ?? "");
  const body = String(formData.get("body") ?? "").trim();
  let threadId = String(formData.get("thread_id") ?? "");
  const bounce = next || (toId ? `/browse/${toId}` : "/app/chat");
  if (body.length < 1) return { ok: false as const, bounce, threadId: threadId || null };
  if (!threadId && toId && me.active_profile_id) {
    const [a, b] = orderedPair(me.active_profile_id, toId);
    await supabase.from("threads").insert({ profile_a: a, profile_b: b });
    const { data: made } = await supabase
      .from("threads")
      .select("id")
      .eq("profile_a", a)
      .eq("profile_b", b)
      .maybeSingle();
    threadId = made?.id ?? "";
  }
  if (!threadId) return { ok: false as const, bounce, threadId: null };
  const { data: thread } = await supabase
    .from("threads")
    .select("id, profile_a, profile_b, frozen")
    .eq("id", threadId)
    .maybeSingle();
  if (!thread || thread.frozen) return { ok: false as const, bounce, threadId };
  const { data: pair } = await supabase
    .from("profiles")
    .select("id, status, created_by, subject_full_name")
    .in("id", [thread.profile_a, thread.profile_b]);
  const mine = (pair ?? []).find((p) => p.created_by === me.id);
  const other = (pair ?? []).find((p) => p.created_by !== me.id);
  if (!mine || mine.status !== "active" || !other || other.status !== "active") {
    return { ok: false as const, bounce, threadId };
  }
  const { data: interestRows } = await supabase
    .from("interests")
    .select("from_profile_id, to_profile_id, status, created_at")
    .or(
      `and(from_profile_id.eq.${mine.id},to_profile_id.eq.${other.id}),and(from_profile_id.eq.${other.id},to_profile_id.eq.${mine.id})`,
    )
    .limit(8);
  if (!pairCanChat(interestRows ?? [], mine.id, other.id)) return { ok: false as const, bounce, threadId };
  const myAccess = await loadMembership(supabase, me);
  const otherAccess = await loadMembershipForProfile(supabase, other.id);
  if (!pairPlanLive(myAccess.live, otherAccess.live)) return { ok: false as const, bounce, threadId };
  const text = body.slice(0, 4000);
  await supabase.from("messages").insert({
    thread_id: threadId,
    sender_profile_id: mine.id,
    body: text,
  });
  const senderName = displayFirstName(mine.subject_full_name ?? "Match");
  const viewerFirst = displayFirstName(other.subject_full_name ?? "there");
  const copy = chatReceivedCopy(viewerFirst, senderName, previewText(text, 80));
  const notify = createServiceClient() ?? supabase;
  await notify.from("notices").insert({
    user_id: other.created_by,
    kind: copy.kind,
    title: copy.title,
    body: copy.body,
    href: `/app/chat/${threadId}`,
    match_profile_id: mine.id,
  });
  revalidatePath(`/app/chat/${threadId}`);
  revalidatePath("/app/chat");
  revalidatePath("/app/alerts");
  revalidatePath(`/browse/${other.id}`);
  revalidatePath("/", "layout");
  return { ok: true as const, bounce, threadId };
}

export async function recordProfileView(viewerId: string, viewedId: string) {
  if (!viewerId || !viewedId || viewerId === viewedId) return;
  const { supabase } = await requireMember();
  const now = new Date().toISOString();
  const { error } = await supabase.from("profile_views").upsert(
    {
      viewer_profile_id: viewerId,
      viewed_profile_id: viewedId,
      viewed_at: now,
    },
    { onConflict: "viewer_profile_id,viewed_profile_id" },
  );
  if (error) {
    await supabase.from("profile_views").insert({
      viewer_profile_id: viewerId,
      viewed_profile_id: viewedId,
    });
  }
}
