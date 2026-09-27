"use server";

import { ensureAppUser, getAuth } from "@/lib/auth/session";

export async function pingPresence() {
  const { supabase, user } = await getAuth();
  if (!supabase || !user) return;
  await ensureAppUser(supabase, user);
}
