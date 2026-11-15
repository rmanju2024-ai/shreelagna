import { ProfileEditScreen } from "@/app/app/profiles/profile-edit-screen";
import { ensureAppUser, getAuth } from "@/lib/auth/session";
import { canEditMemberProfile, isStaffRole } from "@/lib/desk/access";
import { isProfileEditTarget } from "@/lib/profile/sections";
import { createServiceClient } from "@/lib/supabase/server";

export async function StaffMemberEdit({
  id,
  fileHref,
  section,
  saved,
  error,
}: {
  id: string;
  fileHref: string;
  section?: string;
  saved?: boolean;
  error?: string;
}) {
  const { supabase, user } = await getAuth();
  if (!supabase || !user) return <p className="desk-empty">Sign in to edit this biodata.</p>;
  const me = await ensureAppUser(supabase, user);
  if (!me || !isStaffRole(me.role)) return <p className="desk-empty">Staff only.</p>;
  const db = createServiceClient() ?? supabase;
  const [profileJoin, media] = await Promise.all([
    db.from("profiles").select("*, religions(name), communities(name)").eq("id", id).maybeSingle(),
    db.from("media").select("id, kind, storage_path, status").eq("profile_id", id).order("created_at"),
  ]);
  let profile = profileJoin.data;
  if (!profile) {
    profile = (await db.from("profiles").select("*").eq("id", id).maybeSingle()).data;
  }
  if (!profile) return <p className="desk-empty">This profile is no longer on file.</p>;
  const { data: owner } = await db.from("app_users").select("id, email, role").eq("id", profile.created_by).maybeSingle();
  if (!canEditMemberProfile(me, owner)) return <p className="desk-empty">You cannot amend this biodata.</p>;

  const photos = (media.data ?? []).filter((row) => row.kind === "photo");
  const video = (media.data ?? []).find((row) => row.kind === "video") ?? null;
  const audio = (media.data ?? []).find((row) => row.kind === "audio") ?? null;
  const memberCode = typeof profile.member_code === "string" ? profile.member_code : undefined;
  const editSection = section && isProfileEditTarget(section) ? section : undefined;
  const tabHref = (tab: string) => {
    const q = new URLSearchParams(fileHref.split("?")[1] ?? "");
    q.set("open", id);
    q.set("peek", "edit");
    q.set("section", tab);
    q.delete("saved");
    q.delete("error");
    return `/desk/people?${q.toString()}`;
  };

  return (
    <ProfileEditScreen
      profile={profile}
      me={{ ...me, email: owner?.email ?? me.email }}
      photos={photos}
      video={video}
      audio={audio}
      memberCode={memberCode}
      error={error}
      section={editSection}
      saved={saved}
      embedded
      staffEdit
      cancelHref={fileHref}
      nextHref={fileHref}
      sectionHref={tabHref}
    />
  );
}
