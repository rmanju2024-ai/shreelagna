import type { SupabaseClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { listOwnProfiles, type OwnProfileListRow } from "@/lib/profile/own-profile";

export function workingProfileId(activeId: string | null | undefined, ownIds: string[]): string | null {
  if (ownIds.length === 0) return null;
  if (ownIds.length === 1) return ownIds[0] ?? null;
  if (activeId && ownIds.includes(activeId)) return activeId;
  return null;
}

export function mustPickWorkingProfile(activeId: string | null | undefined, ownIds: string[]): boolean {
  return ownIds.length > 1 && !workingProfileId(activeId, ownIds);
}

export async function syncSingleActiveProfile(
  supabase: SupabaseClient,
  userId: string,
  activeId: string | null | undefined,
  onlyId: string,
) {
  if (activeId === onlyId) return;
  await supabase.from("app_users").update({ active_profile_id: onlyId }).eq("id", userId);
}

export async function requireWorkingProfile(
  supabase: SupabaseClient,
  me: { id: string; active_profile_id?: string | null },
): Promise<{ id: string; listed: OwnProfileListRow[] }> {
  const listed = await listOwnProfiles(supabase, me.id);
  const ids = listed.map((row) => row.id);
  if (ids.length === 0) redirect("/app/profiles/new");
  const id = workingProfileId(me.active_profile_id, ids);
  if (!id) redirect("/?pick=1");
  if (ids.length === 1) {
    await syncSingleActiveProfile(supabase, me.id, me.active_profile_id, id);
  }
  return { id, listed };
}
