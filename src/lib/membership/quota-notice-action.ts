"use server";

import { ensureAppUser, getAuth } from "@/lib/auth/session";
import { loadInterestQuota, loadMembership } from "@/lib/membership/load";
import { buildQuotaSoftNotice, type QuotaSoftNotice } from "@/lib/membership/quota-notice";
import { createServiceClient } from "@/lib/supabase/server";

export async function fetchQuotaSoftNotice(): Promise<QuotaSoftNotice | null> {
  const { user, supabase } = await getAuth();
  if (!user || !supabase) return null;
  const me = await ensureAppUser(supabase, user);
  if (!me) return null;
  const db = createServiceClient() ?? supabase;
  const [access, mineRows] = await Promise.all([
    loadMembership(db, me),
    db.from("profiles").select("id, subject_full_name").eq("created_by", me.id),
  ]);
  const mineIds = (mineRows.data ?? []).map((row) => String(row.id));
  const quota = await loadInterestQuota(db, me, access, mineIds);
  const active = me.active_profile_id
    ? (mineRows.data ?? []).find((row) => String(row.id) === me.active_profile_id)
    : (mineRows.data ?? [])[0];
  const name =
    typeof active?.subject_full_name === "string" ? active.subject_full_name : me.display_name;
  return buildQuotaSoftNotice(access, quota, "visit", { name });
}
