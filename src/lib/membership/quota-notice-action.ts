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
    db.from("profiles").select("id").eq("created_by", me.id),
  ]);
  const mineIds = (mineRows.data ?? []).map((row) => String(row.id));
  const quota = await loadInterestQuota(db, me, access, mineIds);
  return buildQuotaSoftNotice(access, quota, "visit");
}
