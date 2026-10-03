"use server";

import { requireDesk } from "@/lib/desk/access";
import { writeAudit } from "@/lib/desk/audit";
import { contactTextHash } from "@/lib/moderation/content-flags";
import { detectReviewLang, isMemberAbout, translateText } from "@/lib/moderation/indian-lang";
import { aboutPlainText } from "@/lib/profile/about-html";
import { missingPayloadColumn } from "@/lib/profile/db-errors";
import { createServiceClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { refreshDesk } from "@/lib/desk/refresh";

const OPS = ["active", "on_hold", "hidden"] as const;

function refresh() {
  refreshDesk(["/desk/profiles", "/desk/analytics"]);
}

export async function setProfileStatus(formData: FormData) {
  const desk = await requireDesk("/desk/profiles");
  if (!desk.allowed) return;
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!id || !OPS.includes(status as (typeof OPS)[number])) return;
  const db = createServiceClient() ?? desk.supabase;
  const { data: profile } = await db.from("profiles").select("id, created_by").eq("id", id).maybeSingle();
  if (!profile) return;
  const { data: owner } = await db.from("app_users").select("role").eq("id", profile.created_by).maybeSingle();
  if (owner?.role === "admin" && !desk.admin) return;
  await db.from("profiles").update({ status }).eq("id", id);
  await writeAudit({
    actorUserId: desk.me?.id,
    actorRole: desk.me?.role,
    action: "profile.status",
    entityType: "profile",
    entityId: id,
    metadata: { status },
  });
  refresh();
}

export async function deleteDeskProfile(
  _previousState: { ok: boolean; error?: string },
  formData: FormData,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const desk = await requireDesk("/desk/profiles");
  if (!desk.allowed) return { ok: false, error: "Not allowed." };
  const id = String(formData.get("profile_id") ?? "");
  if (String(formData.get("confirmation") ?? "").trim().toUpperCase() !== "DELETE") {
    return { ok: false, error: 'Type DELETE to confirm.' };
  }
  const db = createServiceClient() ?? desk.supabase;
  const { data: profile } = await db.from("profiles").select("id, created_by").eq("id", id).maybeSingle();
  if (!profile) return { ok: false, error: "Profile not found." };
  const { data: owner } = await db.from("app_users").select("role").eq("id", profile.created_by).maybeSingle();
  if (owner?.role === "admin" && !desk.admin) return { ok: false, error: "Not allowed." };
  const { data: media, error: mediaError } = await db.from("media").select("storage_path").eq("profile_id", id);
  if (mediaError) return { ok: false, error: "Profile could not be deleted just now." };
  const paths = (media ?? []).map((item) => item.storage_path).filter((path): path is string => Boolean(path));
  if (paths.length) {
    const { error: storageError } = await db.storage.from("profile-media").remove(paths);
    if (storageError) return { ok: false, error: "Profile media could not be removed. Please try again." };
  }
  const { error } = await db.from("profiles").delete().eq("id", id);
  if (error) return { ok: false, error: "Profile could not be deleted just now. Please try again." };
  await writeAudit({
    actorUserId: desk.me?.id,
    actorRole: desk.me?.role,
    action: "profile.delete.desk",
    entityType: "profile",
    entityId: id,
  });
  refresh();
  return { ok: true };
}

async function loadDeskProfile(id: string) {
  const desk = await requireDesk("/desk/profiles");
  if (!desk.allowed) return { error: "Not allowed." as const };
  const db = createServiceClient() ?? desk.supabase;
  const { data: profile } = await db
    .from("profiles")
    .select("id, created_by, about, siblings_note")
    .eq("id", id)
    .maybeSingle();
  if (!profile) return { error: "Profile not found." as const };
  const { data: owner } = await db.from("app_users").select("role").eq("id", profile.created_by).maybeSingle();
  if (owner?.role === "admin" && !desk.admin) return { error: "Not allowed." as const };
  return { desk, db, profile };
}

export async function clearContactFlags(profileId: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const loaded = await loadDeskProfile(profileId);
  if ("error" in loaded) return { ok: false, error: String(loaded.error ?? "Not allowed.") };
  const { desk, db, profile } = loaded;
  const hash = contactTextHash(typeof profile.about === "string" ? profile.about : "");
  const payload = { contact_flags_cleared_hash: hash };
  const { error } = await db.from("profiles").update(payload).eq("id", profileId);
  if (error) {
    if (missingPayloadColumn(error, payload)) {
      return { ok: false, error: "Run SQL 051 in Supabase, then try again." };
    }
    return { ok: false, error: "Could not clear this flag." };
  }
  await writeAudit({
    actorUserId: desk.me?.id,
    actorRole: desk.me?.role,
    action: "profile.flags.clear",
    entityType: "profile",
    entityId: profileId,
  });
  revalidatePath("/desk/profiles");
  revalidatePath(`/app/profiles/${profileId}`);
  revalidatePath(`/browse/${profileId}`);
  return { ok: true };
}

export async function translateProfileCopy(
  profileId: string,
  field: "about" | "family",
  target: "en" | "kn" = "en",
): Promise<{ ok: true; lang: string; text: string } | { ok: false; error: string }> {
  const loaded = await loadDeskProfile(profileId);
  if ("error" in loaded) return { ok: false, error: String(loaded.error ?? "Not allowed.") };
  const copy = fieldCopy(loaded.profile, field);
  const text = await translateCopy(copy, target);
  if (!text) {
    return { ok: false, error: field === "family" ? "No family note to translate." : "No intro to translate." };
  }
  await writeAudit({
    actorUserId: loaded.desk.me?.id,
    actorRole: loaded.desk.me?.role,
    action: "profile.translate",
    entityType: "profile",
    entityId: profileId,
    metadata: { field, target },
  });
  return { ok: true, lang: target === "kn" ? "Kannada" : "English", text };
}

export async function translateProfileBundle(profileId: string): Promise<
  | {
      ok: true;
      introEn: string | null;
      introKn: string | null;
      familyEn: string | null;
      familyKn: string | null;
    }
  | { ok: false; error: string }
> {
  const loaded = await loadDeskProfile(profileId);
  if ("error" in loaded) return { ok: false, error: String(loaded.error ?? "Not allowed.") };
  const about = typeof loaded.profile.about === "string" ? loaded.profile.about : "";
  const family =
    typeof loaded.profile.siblings_note === "string" ? loaded.profile.siblings_note : "";
  const [introEn, introKn, familyEn, familyKn] = await Promise.all([
    translateCopy(about, "en"),
    translateCopy(about, "kn"),
    translateCopy(family, "en"),
    translateCopy(family, "kn"),
  ]);
  await writeAudit({
    actorUserId: loaded.desk.me?.id,
    actorRole: loaded.desk.me?.role,
    action: "profile.translate",
    entityType: "profile",
    entityId: profileId,
    metadata: { field: "bundle", target: "en,kn" },
  });
  return { ok: true, introEn, introKn, familyEn, familyKn };
}

function fieldCopy(profile: { about?: unknown; siblings_note?: unknown }, field: "about" | "family") {
  return field === "family"
    ? typeof profile.siblings_note === "string"
      ? profile.siblings_note
      : ""
    : typeof profile.about === "string"
      ? profile.about
      : "";
}

async function translateCopy(copy: string, target: "en" | "kn"): Promise<string | null> {
  if (!isMemberAbout(copy)) return null;
  const raw = aboutPlainText(copy);
  const lang = detectReviewLang(raw);
  if (lang.code === target) return raw;
  try {
    const text = await translateText(raw, lang.code, target);
    return text.trim() || null;
  } catch {
    return null;
  }
}
