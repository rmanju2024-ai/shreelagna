"use server";

import { ensureAppUser, getAuth } from "@/lib/auth/session";
import { loadInterestQuota, loadWorkingMembership } from "@/lib/membership/load";
import { buildQuotaSoftNotice, type QuotaSoftNotice } from "@/lib/membership/quota-notice";
import { createServiceClient } from "@/lib/supabase/server";

export async function fetchQuotaSoftNotice(): Promise<QuotaSoftNotice | null> {
  const { user, supabase } = await getAuth();
  if (!user || !supabase) return null;
  const me = await ensureAppUser(supabase, user);
  if (!me) return null;
  const db = createServiceClient() ?? supabase;
  const [workingMem, mineRows] = await Promise.all([
    loadWorkingMembership(db, me),
    db.from("profiles").select("id, subject_full_name").eq("created_by", me.id),
  ]);
  const access = workingMem.access;
  const quota = await loadInterestQuota(db, me, access, workingMem.profileId ? [workingMem.profileId] : []);
  const active = workingMem.profileId
    ? (mineRows.data ?? []).find((row) => String(row.id) === workingMem.profileId)
    : (mineRows.data ?? [])[0];
  const name =
    typeof active?.subject_full_name === "string" ? active.subject_full_name : me.display_name;
  return buildQuotaSoftNotice(access, quota, "visit", { name });
}
