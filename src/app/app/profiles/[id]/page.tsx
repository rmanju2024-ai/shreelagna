import { BackToAccount } from "@/components/back-to-account";
import { InnerShell as PageShell } from "@/components/chrome-layout";
import { ProfilePortrait } from "@/app/app/profiles/profile-portrait";
import { ensureAppUser, getAuth } from "@/lib/auth/session";
import { canEditMemberProfile, isStaffRole } from "@/lib/desk/access";
import { isProfileEditTarget, portraitTabForSection } from "@/lib/profile/sections";
import { createServiceClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";

function nestedName(value: unknown): string | undefined {
  if (Array.isArray(value) && value[0] && typeof value[0] === "object" && value[0] && "name" in value[0]) {
    return String((value[0] as { name: unknown }).name);
  }
  if (value && typeof value === "object" && "name" in value) {
    return String((value as { name: unknown }).name);
  }
  return undefined;
}

export default async function ProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; edit?: string; saved?: string; section?: string; tab?: string }>;
}) {
  const [{ id }, query, auth] = await Promise.all([params, searchParams, getAuth()]);
  const { supabase, user } = auth;
  if (!supabase || !user) redirect(`/login?next=/app/profiles/${id}`);
  const me = await ensureAppUser(supabase, user);
  if (!me) redirect("/login?error=account");
  const house = isStaffRole(me.role);
  const db = house ? (createServiceClient() ?? supabase) : supabase;
  const showForm = Boolean(query.error) || query.edit === "1";

  if (!showForm) {
    let peek = (await db.from("profiles").select("id, created_by").eq("id", id).maybeSingle()).data;
    if (!peek && /^SL\d{6,}$/i.test(id)) {
      peek = (await db.from("profiles").select("id, created_by").eq("member_code", id.toUpperCase()).maybeSingle()).data;
    }
    if (peek && peek.created_by === me.id) {
      const { BrowseProfileView } = await import("@/app/browse/browse-profile-view");
      return (
        <PageShell full>
          <BackToAccount align="profile" />
          <BrowseProfileView
            params={Promise.resolve({ id: String(peek.id) })}
            searchParams={Promise.resolve({})}
            editHref={`/app/profiles/${peek.id}?edit=1`}
          />
        </PageShell>
      );
    }
  }

  const [profileJoin, media] = await Promise.all([
    db
      .from("profiles")
      .select("*, religions(name), communities(name)")
      .eq("id", id)
      .maybeSingle(),
    db.from("media").select("id, kind, storage_path, status").eq("profile_id", id).order("created_at"),
  ]);
  let profile = profileJoin.data;
  if (!profile) {
    const plain = await db.from("profiles").select("*").eq("id", id).maybeSingle();
    profile = plain.data;
  }
  if (!profile && /^SL\d{6,}$/i.test(id)) {
    const byCode = await db
      .from("profiles")
      .select("*, religions(name), communities(name)")
      .eq("member_code", id.toUpperCase())
      .maybeSingle();
    profile = byCode.data;
    if (!profile) {
      const plainCode = await db.from("profiles").select("*").eq("member_code", id.toUpperCase()).maybeSingle();
      profile = plainCode.data;
    }
  }
  const mediaRows = media.data;

  if (!profile) notFound();
  const own = profile.created_by === me.id;
  const { data: owner } = own
    ? { data: { id: me.id, email: me.email, role: me.role } }
    : await db.from("app_users").select("id, email, role").eq("id", profile.created_by).maybeSingle();
  if (!own && !canEditMemberProfile(me, owner)) notFound();

  const photos = (mediaRows ?? []).filter((m) => m.kind === "photo");
  const video = (mediaRows ?? []).find((m) => m.kind === "video") ?? null;
  const audio = (mediaRows ?? []).find((m) => m.kind === "audio") ?? null;
  const memberCode = typeof profile.member_code === "string" ? profile.member_code : undefined;

  if (showForm) {
    const { ProfileEditScreen } = await import("@/app/app/profiles/profile-edit-screen");
    const section = query.section && isProfileEditTarget(query.section) ? query.section : undefined;
    return (
      <ProfileEditScreen
        profile={profile}
        me={{ ...me, email: owner?.email ?? me.email }}
        photos={photos}
        video={video}
        audio={audio}
        memberCode={memberCode}
        error={query.error}
        section={section}
      />
    );
  }

  const religionName = nestedName(profile.religions);
  const communityName = nestedName(profile.communities);

  return (
    <PageShell full><BackToAccount align="profile" />
      <ProfilePortrait
        profile={profile}
        memberCode={memberCode}
        religionName={religionName}
        communityName={communityName}
        photos={photos}
        video={video}
        audio={audio}
        initialTab={portraitTabForSection(query.tab) ?? query.tab}
        loginEmail={owner?.email ?? me.email}
        deskReview={house}
      />
    </PageShell>
  );
}
