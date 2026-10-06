"use server";

import type { SupabaseClient } from "@supabase/supabase-js";
import { ensureAppUser } from "@/lib/auth/session";
import { findOwnProfile } from "@/lib/profile/own-profile";
import { isUniqueViolation, missingPayloadColumn, saveErrorMessage } from "@/lib/profile/db-errors";
import { displayFirstName, toDbCreatorRelationship } from "@/lib/profile/options";
import { isMandatoryReadyFromRecord, nextReviewStatus, smsOtpRequiredFromEnv } from "@/lib/profile/completeness";
import { loadHouseReady, viewerEmailVerified } from "@/lib/profile/house-ready";
import { formList } from "@/lib/profile/multi-values";
import { loadFormLists } from "@/lib/profile/load-form-lists";
import { ABOUT_MAX, ABOUT_MIN, FAMILY_NOTE_MAX, aboutPlainText } from "@/lib/profile/about-html";
import { contactViewedCopy, interestReceivedCopy } from "@/lib/match/alert-copy";
import { canAlertInterest } from "@/lib/match/profile-settings";
import { canSendInterest, effectiveInterestStatus, openInterestBlocksSend } from "@/lib/match/interest-status";
import { joinParentTags } from "@/lib/profile/parent-line";
import { parseProfileForm } from "@/lib/validation/profile";
import { isProfileEditSection, pickSectionRecord, SECTION_FORM_KEYS } from "@/lib/profile/sections";
import { buildProfileSaveRow, pickSaveRow } from "@/lib/profile/save-payload";
import { canEditMemberProfile, isStaffRole } from "@/lib/desk/access";
import { hasDeleteConfirmation } from "@/lib/profile/delete-confirmation";
import { contentFlags, MEMBER_CONTACT_WARNING } from "@/lib/moderation/content-flags";
import { writeAudit } from "@/lib/desk/audit";
import { notifyInterestReceived } from "@/lib/notify/dispatch";
import { digitsOnly } from "@/lib/notify/phone";
import { complimentaryPaidProfileAccess, pairPlanLive } from "@/lib/membership/access";
import { loadInterestQuota, loadMembership } from "@/lib/membership/load";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { readSessionFromCookies, restInsertProfile } from "@/lib/supabase/user-rest";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { redirect } from "next/navigation";

async function requireMember() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/app");
  const cookieSession = await readSessionFromCookies();
  if (cookieSession) {
    await supabase.auth.setSession(cookieSession);
  }
  const me = await ensureAppUser(supabase, user);
  if (!me) redirect("/login?error=account");
  const accessToken =
    cookieSession?.access_token ?? (await supabase.auth.getSession()).data.session?.access_token;
  const admin = createServiceClient();
  return { supabase: admin ?? supabase, user, me, accessToken, usingService: Boolean(admin) };
}

async function loadEditableProfile(
  supabase: SupabaseClient,
  me: { id: string; role?: string | null },
  profileId: string,
) {
  const { data } = await supabase.from("profiles").select("id, created_by").eq("id", profileId).maybeSingle();
  if (!data) return null;
  if (data.created_by === me.id) return data;
  if (!isStaffRole(me.role)) return null;
  const { data: owner } = await supabase.from("app_users").select("role").eq("id", data.created_by).maybeSingle();
  if (!canEditMemberProfile(me, { id: data.created_by, role: owner?.role })) return null;
  return data;
}

async function recordSaveError(error: { message?: string; code?: string; details?: string; hint?: string } | null) {
  try {
    await writeFile(
      path.join(process.cwd(), ".next", "save-last-error.json"),
      JSON.stringify(
        {
          at: new Date().toISOString(),
          code: error?.code ?? null,
          message: error?.message ?? null,
          details: error?.details ?? null,
          hint: error?.hint ?? null,
        },
        null,
        2,
      ),
    );
  } catch {
    /* ignore */
  }
}

async function writeCompleteness(
  supabase: Awaited<ReturnType<typeof createClient>>,
  profileId: string,
  emailOtpVerified: boolean,
  opts?: { contentChanged?: boolean },
) {
  const { data: photos } = await supabase
    .from("media")
    .select("id")
    .eq("profile_id", profileId)
    .eq("kind", "photo")
    .eq("status", "approved")
    .limit(1);

  const { data: intros } = await supabase
    .from("media")
    .select("kind")
    .eq("profile_id", profileId)
    .in("kind", ["video", "audio"])
    .eq("status", "approved");

  const { data: saved } = await supabase.from("profiles").select("*").eq("id", profileId).maybeSingle();

  if (!saved) return;
  const complete = isMandatoryReadyFromRecord(saved as Record<string, unknown>, {
    hasApprovedPhoto: Boolean(photos?.length),
    hasVideo: Boolean(intros?.some((row) => row.kind === "video")),
    hasAudio: Boolean(intros?.some((row) => row.kind === "audio")),
    emailOtpVerified,
    smsOtpRequired: smsOtpRequiredFromEnv(),
  });
  await supabase
    .from("profiles")
    .update({
      is_complete: complete,
      status: nextReviewStatus(typeof saved.status === "string" ? saved.status : null, complete, opts),
    })
    .eq("id", profileId);
}

async function insertOwnProfile(
  supabase: Awaited<ReturnType<typeof createClient>>,
  payload: Record<string, unknown>,
  userId: string,
  accessToken?: string,
): Promise<{ id: string | null; error: { message?: string; code?: string; details?: string; hint?: string } | null }> {
  let current: Record<string, unknown> = { ...payload };
  let lastError: { message?: string; code?: string; details?: string; hint?: string } | null = null;
  const attempts = Math.min(12, Math.max(4, Object.keys(current).length));
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    let id: string | null = null;
    let error: { message?: string; code?: string; details?: string; hint?: string } | null = null;

    if (accessToken) {
      const viaRest = await restInsertProfile(accessToken, current);
      id = viaRest.id;
      error = viaRest.error;
    } else {
      const viaClient = await supabase.from("profiles").insert(current).select("id").maybeSingle();
      id = viaClient.data?.id ?? null;
      error = viaClient.error;
    }

    if (id) return { id, error: null };
    if (!error) {
      const row = await findOwnProfile(supabase, userId);
      return { id: row?.id ?? null, error: null };
    }
    lastError = error;

    const missing = missingPayloadColumn(error, current);
    if (missing) {
      delete current[missing];
      continue;
    }
    const hay = `${error.code ?? ""} ${error.message ?? ""} ${error.details ?? ""}`.toLowerCase();
    if (hay.includes("member_code") && (hay.includes("null") || hay.includes("not-null") || hay.includes("not null"))) {
      const { allocateMemberCode } = await import("@/lib/profile/member-code");
      current = { ...current, member_code: allocateMemberCode() };
      continue;
    }
    if (isUniqueViolation(error) || error.code === "PGRST116" || hay.includes("0 rows")) {
      const row = await findOwnProfile(supabase, userId);
      if (row?.id) return { id: row.id, error: null };
    }
    await recordSaveError(error);
    return { id: null, error };
  }
  await recordSaveError(lastError);
  return { id: null, error: lastError ?? { message: "Could not save the profile." } };
}

export async function saveProfile(formData: FormData) {
  const { supabase, me, accessToken, usingService } = await requireMember();
  const lists = await loadFormLists();
  const sectionRaw = String(formData.get("section") ?? "");
  const section = isProfileEditSection(sectionRaw) ? sectionRaw : undefined;
  const bounceId = String(formData.get("id") ?? "");
  const saveDraft = !bounceId && !section && formData.get("save_intent") === "draft";

  const raw: Record<string, unknown> = {
    id: bounceId,
    creator_relationship: String(formData.get("creator_relationship") ?? ""),
    profile_type: String(formData.get("profile_type") ?? ""),
    subject_full_name: String(formData.get("subject_full_name") ?? ""),
    surname: String(formData.get("surname") ?? ""),
    date_of_birth: String(formData.get("date_of_birth") ?? ""),
    birth_time: String(formData.get("birth_time") ?? ""),
    mother_tongue: String(formData.get("mother_tongue") ?? "") || undefined,
    height_cm: formData.get("height_cm"),
    marital_status: String(formData.get("marital_status") ?? ""),
    diet: String(formData.get("diet") ?? "") || undefined,
    native_country: String(formData.get("native_country") ?? ""),
    native_state: String(formData.get("native_state") ?? "") || undefined,
    native_city: String(formData.get("native_city") ?? ""),
    current_city: String(formData.get("current_city") ?? ""),
    current_state: String(formData.get("current_state") ?? "") || undefined,
    qualification: String(formData.get("qualification") ?? ""),
    occupation: String(formData.get("occupation") ?? ""),
    employed_in: String(formData.get("employed_in") ?? ""),
    income_band: String(formData.get("income_band") ?? ""),
    employer_name: String(formData.get("employer_name") ?? ""),
    settle_abroad: String(formData.get("settle_abroad") ?? ""),
    future_ambition: String(formData.get("future_ambition") ?? ""),
    family_type: String(formData.get("family_type") ?? ""),
    birth_city: String(formData.get("birth_city") ?? ""),
    living_arrangement: String(formData.get("living_arrangement") ?? ""),
    college_name: String(formData.get("college_name") ?? ""),
    hobbies: String(formData.get("hobbies") ?? ""),
    brothers_count: formData.get("brothers_count"),
    brothers_married_count: formData.get("brothers_married_count"),
    sisters_count: formData.get("sisters_count"),
    sisters_married_count: formData.get("sisters_married_count"),
    father_name: String(formData.get("father_name") ?? ""),
    father_occupation: joinParentTags(formData.getAll("father_occupation")),
    mother_name: String(formData.get("mother_name") ?? ""),
    mother_occupation: joinParentTags(formData.getAll("mother_occupation")),
    siblings_note: aboutPlainText(String(formData.get("siblings_note") ?? "")).slice(0, FAMILY_NOTE_MAX),
    family_status: String(formData.get("family_status") ?? ""),
    family_location: String(formData.get("family_location") ?? ""),
    physical_status: String(formData.get("physical_status") ?? ""),
    health_notes: String(formData.get("health_notes") ?? ""),
    sub_community: String(formData.get("sub_community") ?? ""),
    blood_group: String(formData.get("blood_group") ?? ""),
    grew_up_in: String(formData.get("grew_up_in") ?? ""),
    gotra: String(formData.get("gotra") ?? ""),
    rashi: String(formData.get("rashi") ?? ""),
    lagna: String(formData.get("lagna") ?? ""),
    nakshatra: String(formData.get("nakshatra") ?? ""),
    nakshatra_pada: String(formData.get("nakshatra_pada") ?? ""),
    gana: String(formData.get("gana") ?? ""),
    yoni_animal: String(formData.get("yoni_animal") ?? ""),
    manglik: String(formData.get("manglik") ?? ""),
    citizenship: String(formData.get("citizenship") ?? ""),
    current_country: String(formData.get("current_country") ?? ""),
    hobby_list: formList(formData, "hobby_list"),
    pref_age_min: formData.get("pref_age_min"),
    pref_age_max: formData.get("pref_age_max"),
    pref_maritals: formList(formData, "pref_maritals"),
    pref_educations: formList(formData, "pref_educations"),
    pref_occupations: formList(formData, "pref_occupations"),
    pref_countries: formList(formData, "pref_countries"),
    pref_notes: String(formData.get("pref_notes") ?? ""),
    known_languages: formList(formData, "known_languages"),
    pref_tongues: formList(formData, "pref_tongues"),
    pref_religions: formList(formData, "pref_religions"),
    pref_communities: formList(formData, "pref_communities"),
    pref_states: formList(formData, "pref_states"),
    pref_cities: formList(formData, "pref_cities"),
    pref_height_min: formData.get("pref_height_min"),
    pref_height_max: formData.get("pref_height_max"),
    pref_diets: formList(formData, "pref_diets"),
    pref_incomes: formList(formData, "pref_incomes"),
    pref_employed: formList(formData, "pref_employed"),
    pref_managed: formList(formData, "pref_managed"),
    pref_horoscope: String(formData.get("pref_horoscope") ?? ""),
    about: String(formData.get("about") ?? ""),
    religion_id: String(formData.get("religion_id") ?? ""),
    community_id: String(formData.get("community_id") ?? ""),
    prefer_not_community: false,
    subject_mobile: String(formData.get("subject_mobile") ?? "").replace(/\s+/g, ""),
  };

  const parsed = parseProfileForm(
    section ? pickSectionRecord(raw, SECTION_FORM_KEYS[section]) : raw,
    lists,
    section,
    saveDraft,
  );

  if (!parsed.ok) {
    const path = bounceId ? `/app/profiles/${bounceId}` : "/app/profiles/new";
    const extra = bounceId && section ? `&edit=1&section=${section}` : bounceId ? "&edit=1" : "";
    redirect(`${path}?error=${encodeURIComponent(parsed.error)}${extra}`);
  }

  const editingId = bounceId || parsed.data.id || null;
  const mine = await findOwnProfile(supabase, me.id);
  const memberCode = String(formData.get("member_code") ?? "").trim();
  const houseEdit = Boolean(isStaffRole(me.role) && editingId && editingId !== mine?.id);
  let target = mine;
  let ownerId = me.id;

  if (houseEdit && editingId) {
    const { data: row } = await supabase
      .from("profiles")
      .select("id, created_by, creator_relationship, profile_type, member_code")
      .eq("id", editingId)
      .maybeSingle();
    if (!row) redirect("/desk/profiles");
    const { data: owner } = await supabase.from("app_users").select("id, role").eq("id", row.created_by).maybeSingle();
    if (!canEditMemberProfile(me, { id: row.created_by, role: owner?.role })) {
      redirect("/desk/profiles");
    }
    target = row;
    ownerId = row.created_by;
  } else {
    if (mine && !editingId) {
      redirect(`/app/profiles/${mine.id}`);
    }
    if (mine && editingId && editingId !== mine.id) {
      redirect(`/app/profiles/${mine.id}`);
    }
    if (
      editingId &&
      memberCode &&
      mine &&
      "member_code" in mine &&
      typeof mine.member_code === "string" &&
      mine.member_code &&
      memberCode !== mine.member_code
    ) {
      redirect(`/app/profiles/${mine.id}?error=${encodeURIComponent("This profile belongs to another member ID.")}&edit=1`);
    }
  }

  const fullPayload = buildProfileSaveRow(parsed.data, {
    createdBy: ownerId,
    creatorRelationship:
      editingId && target && typeof target.creator_relationship === "string" && target.creator_relationship
        ? target.creator_relationship
        : toDbCreatorRelationship(parsed.data.creator_relationship ?? "self"),
    profileType:
      editingId && target && "profile_type" in target && (target.profile_type === "vadhu" || target.profile_type === "vara")
        ? target.profile_type
        : parsed.data.profile_type === "vara"
          ? "vara"
          : "vadhu",
  });
  const payload = pickSaveRow(fullPayload, section, Boolean(editingId));

  let profileId = editingId;
  if (editingId && typeof payload.subject_mobile === "string") {
    const { data: currentMobile } = await supabase
      .from("profiles")
      .select("subject_mobile")
      .eq("id", editingId)
      .maybeSingle();
    if (digitsOnly(currentMobile?.subject_mobile) !== digitsOnly(payload.subject_mobile)) {
      payload.phone_otp_verified_at = null;
    }
  }
  if (editingId) {
    const current: Record<string, unknown> = { ...payload };
    let saved = false;
    let lastError: { message?: string; code?: string; details?: string; hint?: string } | null = null;
    const attempts = Math.min(12, Math.max(4, Object.keys(current).length));
    for (let attempt = 0; attempt < attempts; attempt += 1) {
      let update = supabase.from("profiles").update(current).eq("id", editingId);
      if (!houseEdit) {
        update = update.eq("created_by", me.id);
        if (mine && "member_code" in mine && typeof mine.member_code === "string" && mine.member_code) {
          update = update.eq("member_code", mine.member_code);
        }
      }
      const { error } = await update;
      if (!error) {
        saved = true;
        break;
      }
      lastError = error;
      const missing = missingPayloadColumn(error, current);
      if (missing) {
        delete current[missing];
        continue;
      }
      await recordSaveError(error);
      redirect(
        `/app/profiles/${editingId}?error=${encodeURIComponent(saveErrorMessage(error))}&edit=1${section ? `&section=${section}` : ""}`,
      );
    }
    if (!saved) {
      await recordSaveError(lastError);
      redirect(
        `/app/profiles/${editingId}?error=${encodeURIComponent(saveErrorMessage(lastError))}&edit=1${section ? `&section=${section}` : ""}`,
      );
    }
  } else {
    const inserted = await insertOwnProfile(
      supabase,
      payload,
      me.id,
      usingService ? undefined : accessToken,
    );
    if (!inserted.id) {
      const again = await findOwnProfile(supabase, me.id);
      if (again) {
        redirect(`/app/profiles/${again.id}`);
      }
      redirect(`/app/profiles/new?error=${encodeURIComponent(saveErrorMessage(inserted.error))}`);
    }
    profileId = inserted.id;
  }

  await writeCompleteness(supabase, profileId!, Boolean(me.email_otp_verified_at), {
    contentChanged: !houseEdit && section === "about",
  });

  if (!houseEdit && me.active_profile_id !== profileId) {
    await supabase.from("app_users").update({ active_profile_id: profileId }).eq("id", me.id);
  }
  if (houseEdit && profileId) {
    await writeAudit({
      actorUserId: me.id,
      actorRole: me.role,
      action: "profile.edit",
      entityType: "profile",
      entityId: profileId,
      metadata: { section: section ?? "full" },
    });
  }

  revalidatePath(`/app/profiles/${profileId}`);
  revalidatePath("/desk/profiles");
  redirect(`/app/profiles/${profileId}?saved=1${section ? `&tab=${section}` : ""}`);
}

export async function setActiveProfile(formData: FormData) {
  const { supabase, me } = await requireMember();
  const id = String(formData.get("id") ?? "");
  if (!id) redirect("/app");
  const { data } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", id)
    .eq("created_by", me.id)
    .maybeSingle();
  if (!data) redirect("/app");
  await supabase.from("app_users").update({ active_profile_id: id }).eq("id", me.id);
  revalidatePath("/app");
  revalidatePath("/browse");
  redirect("/app");
}

export async function deleteOwnProfile(
  _previousState: { ok: boolean; error?: string },
  formData: FormData,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { supabase, me } = await requireMember();
  const profileId = String(formData.get("profile_id") ?? "");
  if (!hasDeleteConfirmation(formData.get("confirmation"))) {
    return { ok: false, error: 'Type DELETE to confirm.' };
  }
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, created_by")
    .eq("id", profileId)
    .maybeSingle();
  if (!profile || profile.created_by !== me.id) {
    return { ok: false, error: "This profile is no longer available." };
  }
  const { data: media, error: mediaError } = await supabase
    .from("media")
    .select("storage_path")
    .eq("profile_id", profileId);
  if (mediaError) return { ok: false, error: "This profile could not be deleted just now." };
  const paths = (media ?? []).map((item) => item.storage_path).filter((path): path is string => Boolean(path));
  if (paths.length) {
    const { error: storageError } = await supabase.storage.from("profile-media").remove(paths);
    if (storageError) return { ok: false, error: "Profile media could not be removed. Please try again." };
  }
  const { error } = await supabase.from("profiles").delete().eq("id", profileId);
  if (error) return { ok: false, error: "This profile could not be deleted just now. Please try again." };
  await writeAudit({
    actorUserId: me.id,
    actorRole: me.role,
    action: "profile.delete.self",
    entityType: "profile",
    entityId: profileId,
  });
  revalidatePath("/app");
  revalidatePath("/browse");
  return { ok: true };
}

export async function saveShortlist(profileId: string, want: boolean): Promise<{ ok: boolean; on: boolean }> {
  const { supabase, me } = await requireMember();
  if (!profileId || !me.active_profile_id || profileId === me.active_profile_id) return { ok: false, on: false };
  const db = createServiceClient() ?? supabase;
  const { data: existing } = await db
    .from("profile_shortlists")
    .select("owner_profile_id")
    .eq("owner_profile_id", me.active_profile_id)
    .eq("shortlisted_profile_id", profileId)
    .maybeSingle();
  const on = Boolean(existing);
  if (want === on) return { ok: true, on };
  const result = want
    ? await db.from("profile_shortlists").insert({ owner_profile_id: me.active_profile_id, shortlisted_profile_id: profileId })
    : await db.from("profile_shortlists").delete().eq("owner_profile_id", me.active_profile_id).eq("shortlisted_profile_id", profileId);
  if (result.error) return { ok: false, on };
  revalidatePath("/app/shortlist");
  return { ok: true, on: want };
}

export async function toggleShortlist(formData: FormData) {
  const profileId = String(formData.get("profile_id") ?? "");
  const returnTo = String(formData.get("return_to") ?? "/browse");
  const flag = (code: string) => `${returnTo}${returnTo.includes("?") ? "&" : "?"}safety=${code}`;
  const { supabase, me } = await requireMember();
  if (!profileId || !me.active_profile_id || profileId === me.active_profile_id) redirect("/browse");
  const db = createServiceClient() ?? supabase;
  const { data: existing } = await db
    .from("profile_shortlists")
    .select("owner_profile_id")
    .eq("owner_profile_id", me.active_profile_id)
    .eq("shortlisted_profile_id", profileId)
    .maybeSingle();
  const result = await saveShortlist(profileId, !existing);
  if (!result.ok) redirect(flag("shortlist_error"));
  redirect(flag(result.on ? "shortlisted" : "unshortlisted"));
}

export async function sendInterest(formData: FormData): Promise<{ ok: boolean; interestId?: string | null; error?: string }> {
  const { supabase, me } = await requireMember();
  const toId = String(formData.get("to_profile_id") ?? "");
  if (!toId || !me.active_profile_id) return { ok: false, error: "need_profile" };

  const mine = await loadHouseReady(supabase, me.active_profile_id, viewerEmailVerified(me));

  if (!mine?.ready || mine.status !== "active") return { ok: false, error: "incomplete" };
  if (!canSendInterest(mine.id, toId)) return { ok: false, error: "self" };

  const access = await loadMembership(supabase, me);
  if (!access.live) return { ok: false, error: "plan" };
  const [quota, alreadyView] = await Promise.all([
    loadInterestQuota(supabase, me, access, [mine.id]),
    supabase.from("contact_views").select("id").eq("viewer_profile_id", mine.id).eq("viewed_profile_id", toId).maybeSingle(),
  ]);
  if (!alreadyView.data && !quota.canSend) return { ok: false, error: "quota" };

  let { data: target } = await supabase
    .from("profiles")
    .select("id, status, created_by, subject_full_name, notify_interest, subject_mobile")
    .eq("id", toId)
    .maybeSingle();
  if (!target) {
    const retry = await supabase
      .from("profiles")
      .select("id, status, created_by, subject_full_name, subject_mobile")
      .eq("id", toId)
      .maybeSingle();
    target = retry.data as typeof target;
  }
  if (!target || target.status !== "active") return { ok: false, error: "unavailable" };

  const { data: existing } = await supabase
    .from("interests")
    .select("id, from_profile_id, to_profile_id, status, created_at")
    .or(
      `and(from_profile_id.eq.${mine.id},to_profile_id.eq.${toId}),and(from_profile_id.eq.${toId},to_profile_id.eq.${mine.id})`,
    )
    .limit(8);
  const open = (existing ?? []).find((row) =>
    openInterestBlocksSend(effectiveInterestStatus(row.status, row.created_at)),
  );
  if (open) return { ok: true, interestId: typeof open.id === "string" ? open.id : null };
  const closedIds = (existing ?? [])
    .filter((row) => !openInterestBlocksSend(effectiveInterestStatus(row.status, row.created_at)))
    .map((row) => row.id);
  if (closedIds.length) {
    await supabase.from("interests").delete().in("id", closedIds);
  }

  const inserted = await supabase
    .from("interests")
    .insert({ from_profile_id: mine.id, to_profile_id: toId })
    .select("id")
    .maybeSingle();
  if (inserted.error && !inserted.error.message.toLowerCase().includes("duplicate")) {
    return { ok: false, error: "could_not_send" };
  }
  const interestId = typeof inserted.data?.id === "string" ? inserted.data.id : null;
  const [a, b] = mine.id < toId ? [mine.id, toId] : [toId, mine.id];
  void supabase.from("threads").insert({ profile_a: a, profile_b: b });

  if (canAlertInterest(target)) {
    const senderName = displayFirstName(mine.subject_full_name ?? "A member");
    const viewerFirst = displayFirstName(target.subject_full_name ?? "there");
    const copy = interestReceivedCopy(viewerFirst, senderName);
    const ownerId = target.created_by;
    const mobile = typeof target.subject_mobile === "string" ? target.subject_mobile : null;
    after(async () => {
      await supabase.from("notices").insert({
        user_id: ownerId,
        kind: copy.kind,
        title: copy.title,
        body: copy.body,
        href: "/app/interests",
        match_profile_id: mine.id,
      });
      await notifyInterestReceived(ownerId, senderName, mobile);
      revalidatePath("/app/alerts");
      revalidatePath("/app/interests");
    });
  } else {
    after(() => {
      revalidatePath("/app/alerts");
      revalidatePath("/app/interests");
    });
  }
  return { ok: true, interestId };
}

export async function cancelInterest(formData: FormData): Promise<{ ok: boolean }> {
  const { supabase, me } = await requireMember();
  const toId = String(formData.get("to_profile_id") ?? "");
  const interestKey = String(formData.get("interest_id") ?? "");
  if (!toId || !me.active_profile_id) return { ok: false };
  const { data: row } = await supabase
    .from("interests")
    .select("id, from_profile_id, to_profile_id, status, created_at")
    .eq("id", interestKey)
    .maybeSingle();
  if (!row || row.from_profile_id !== me.active_profile_id || row.to_profile_id !== toId) {
    return { ok: false };
  }
  if (effectiveInterestStatus(row.status, row.created_at) !== "pending") {
    return { ok: false };
  }
  await supabase.from("interests").delete().eq("id", row.id);
  after(() => {
    revalidatePath("/app/interests");
    revalidatePath("/app/alerts");
  });
  return { ok: true };
}

export async function revealContact(toId: string): Promise<{
  ok: boolean;
  mobile?: string;
  email?: string;
  used?: number;
  left?: number | null;
  limit?: number | null;
  error?: string;
}> {
  const { supabase, me } = await requireMember();
  if (!toId || !me.active_profile_id) return { ok: false, error: "need_profile" };
  const db = createServiceClient() ?? supabase;
  const mineId = me.active_profile_id;
  const [mine, viewRes, interestRes, targetRes] = await Promise.all([
    loadHouseReady(supabase, mineId, viewerEmailVerified(me)),
    db.from("contact_views").select("id").eq("viewer_profile_id", mineId).eq("viewed_profile_id", toId).maybeSingle(),
    db.from("interests").select("id").eq("from_profile_id", mineId).eq("to_profile_id", toId).limit(1).maybeSingle(),
    db.from("profiles").select("id, status, subject_mobile, created_by, contact_release_mode").eq("id", toId).maybeSingle(),
  ]);
  const target = targetRes.data;
  if (!mine?.ready || mine.status !== "active") return { ok: false, error: "incomplete" };
  if (mine.id === toId) return { ok: false, error: "own" };
  if (!target || target.status !== "active") return { ok: false, error: "unavailable" };
  if (target.contact_release_mode === "never") return { ok: false, error: "contact_private" };

  const alreadyCounted = Boolean(viewRes.data || interestRes.data);
  let used = 0;
  let left: number | null = null;
  let limit: number | null = null;
  if (!alreadyCounted) {
    const access = await loadMembership(supabase, me);
    if (!access.live) {
      const ownerId = typeof target.created_by === "string" ? target.created_by : "";
      const { data: ownerRow } = ownerId
        ? await db.from("app_users").select("id, role, welcome_started_at, welcome_days").eq("id", ownerId).maybeSingle()
        : { data: null };
      const targetAccess = ownerRow ? await loadMembership(db, ownerRow) : null;
      const { data: links } = await db
        .from("interests")
        .select("status, created_at")
        .or(
          `and(from_profile_id.eq.${mine.id},to_profile_id.eq.${toId}),and(from_profile_id.eq.${toId},to_profile_id.eq.${mine.id})`,
        )
        .limit(8);
      const interestOpen = (links ?? []).some((row) =>
        openInterestBlocksSend(effectiveInterestStatus(row.status, row.created_at ?? "")),
      );
      const guestPass = complimentaryPaidProfileAccess({
        viewerKind: access.kind,
        targetKind: targetAccess?.kind,
        interestOpen,
        pairLive: pairPlanLive(access.live, targetAccess?.live),
      });
      if (!guestPass) return { ok: false, error: "plan" };
    } else {
      const quota = await loadInterestQuota(supabase, me, access, [mine.id]);
      if (!quota.canSend) return { ok: false, error: "quota" };
      used = quota.used + 1;
      left = quota.left == null ? null : Math.max(0, quota.left - 1);
      limit = quota.limit;
    }
  }

  const { data: owner } = await db.from("app_users").select("email").eq("id", target.created_by).maybeSingle();
  const mobile = typeof target.subject_mobile === "string" ? target.subject_mobile.trim() : "";
  const email = typeof owner?.email === "string" ? owner.email.trim() : "";

  if (!viewRes.data) {
    const { error } = await supabase.from("contact_views").upsert(
      { viewer_profile_id: mine.id, viewed_profile_id: toId },
      { onConflict: "viewer_profile_id,viewed_profile_id", ignoreDuplicates: true },
    );
    if (error) return { ok: false, error: "could_not_send" };
  }

  if (me.role !== "admin" && me.role !== "service") {
    const copy = contactViewedCopy(displayFirstName(mine.subject_full_name ?? "A member"));
    const ownerUserId = target.created_by;
    after(async () => {
      revalidatePath("/app/plans");
      revalidatePath("/app/alerts");
      const now = new Date().toISOString();
      const { data: existing } = await db
        .from("notices")
        .select("id")
        .eq("user_id", ownerUserId)
        .eq("kind", "contact_view")
        .eq("match_profile_id", mine.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (existing?.id) {
        await db
          .from("notices")
          .update({
            created_at: now,
            read_at: null,
            title: copy.title,
            body: copy.body,
            href: `/browse/${mine.id}`,
          })
          .eq("id", existing.id);
      } else {
        await db.from("notices").insert({
          user_id: ownerUserId,
          kind: copy.kind,
          title: copy.title,
          body: copy.body,
          href: `/browse/${mine.id}`,
          match_profile_id: mine.id,
        });
      }
    });
  } else {
    after(() => {
      revalidatePath("/app/plans");
      revalidatePath("/app/alerts");
    });
  }

  return { ok: true, mobile, email, used, left, limit };
}

export async function viewContact(formData: FormData) {
  const toId = String(formData.get("to_profile_id") ?? "");
  const result = await revealContact(toId);
  if (!result.ok) {
    if (result.error === "need_profile") redirect("/browse?error=need_profile");
    if (result.error === "incomplete") redirect(`/browse/${toId}?error=incomplete`);
    if (result.error === "plan") redirect(`/browse/${toId}?error=plan`);
    if (result.error === "quota") redirect(`/browse/${toId}?error=quota`);
    if (result.error === "contact_private") redirect(`/browse/${toId}?error=contact_private`);
    if (result.error === "unavailable") redirect("/browse?error=unavailable");
    if (result.error === "could_not_send") redirect(`/browse/${toId}?error=could_not_send`);
    redirect(`/browse/${toId}`);
  }
  redirect(`/browse/${toId}?contact=1`);
}

export async function saveAboutIntro(
  profileId: string,
  about: string,
): Promise<{ ok: true; warning?: string } | { ok: false; error: string }> {
  const { supabase, me } = await requireMember();
  const text = aboutPlainText(about);
  if (text.length < ABOUT_MIN) {
    return { ok: false, error: `Write at least ${ABOUT_MIN} characters.` };
  }
  if (text.length > ABOUT_MAX) {
    return { ok: false, error: `Keep About under ${ABOUT_MAX} characters.` };
  }
  const mine = await loadEditableProfile(supabase, me, profileId);
  if (!mine) return { ok: false, error: "This profile could not be saved just now." };
  const payload: Record<string, unknown> = { about, intro_shown: "about" };
  let { error } = await supabase.from("profiles").update(payload).eq("id", profileId);
  if (error && missingPayloadColumn(error, payload)) {
    delete payload.intro_shown;
    const retry = await supabase.from("profiles").update(payload).eq("id", profileId);
    error = retry.error;
  }
  if (error) return { ok: false, error: saveErrorMessage(error) };
  await writeCompleteness(supabase, profileId, Boolean(me.email_otp_verified_at), {
    contentChanged: !isStaffRole(me.role),
  });
  revalidatePath(`/app/profiles/${profileId}`);
  revalidatePath("/desk/profiles");
  const flagged = contentFlags(about);
  return {
    ok: true,
    warning: !isStaffRole(me.role) && flagged.length ? MEMBER_CONTACT_WARNING : undefined,
  };
}

export async function saveIntroChoice(
  profileId: string,
  shown: "video" | "audio",
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { supabase, me } = await requireMember();
  const mine = await loadEditableProfile(supabase, me, profileId);
  if (!mine) return { ok: false, error: "This profile could not be saved just now." };
  const { data: clips, error: clipError } = await supabase
    .from("media")
    .select("id")
    .eq("profile_id", profileId)
    .eq("kind", shown)
    .eq("status", "approved")
    .limit(1);
  if (clipError) return { ok: false, error: "We could not check this introduction just now. Please try again." };
  if (!clips?.length) {
    return {
      ok: false,
      error: shown === "video" ? "Add a video first, then Save." : "Add a voice note first, then Save.",
    };
  }
  const { error } = await supabase
    .from("profiles")
    .update({ intro_shown: shown })
    .eq("id", profileId);
  if (error) {
    if (missingPayloadColumn(error, { intro_shown: shown })) {
      return {
        ok: false,
        error: "Your site database needs the latest update before introductions can be shown. Please ask the site owner to apply migration 035.",
      };
    }
    return { ok: false, error: saveErrorMessage(error) };
  }
  await writeCompleteness(supabase, profileId, Boolean(me.email_otp_verified_at), {
    contentChanged: !isStaffRole(me.role),
  });
  revalidatePath(`/app/profiles/${profileId}`);
  revalidatePath("/desk/profiles");
  return { ok: true };
}

export async function setIntroShown(profileId: string, shown: "about" | "video" | "audio") {
  const { supabase, me } = await requireMember();
  const data = await loadEditableProfile(supabase, me, profileId);
  if (!data) return;
  const { error } = await supabase
    .from("profiles")
    .update({ intro_shown: shown })
    .eq("id", profileId);
  if (error && missingPayloadColumn(error, { intro_shown: shown })) return;
  revalidatePath("/app");
  revalidatePath(`/app/profiles/${profileId}`);
}

export async function refreshProfileCompleteness(profileId: string) {
  const { supabase, me } = await requireMember();
  const data = await loadEditableProfile(supabase, me, profileId);
  if (!data) return;
  await writeCompleteness(supabase, profileId, Boolean(me.email_otp_verified_at), {
    contentChanged: !isStaffRole(me.role),
  });
  revalidatePath("/app");
  revalidatePath(`/app/profiles/${profileId}`);
  revalidatePath("/desk/profiles");
}
