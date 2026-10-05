import Link from "next/link";
import { InnerShell as PageShell } from "@/components/chrome-layout";
import { ProfileForm } from "@/app/app/profiles/profile-form";
import { AlbumViewer } from "@/app/app/profiles/album-viewer";
import { IntroductionEditor } from "@/app/app/profiles/introduction-editor";
import { loadFaithCatalog, loadFormLists } from "@/lib/profile/load-form-lists";
import { aboutPlainText } from "@/lib/profile/about-html";
import { portraitTabForSection, type ProfileEditTarget } from "@/lib/profile/sections";
import { btnHero, btnHeroGhost } from "@/lib/ui/classes";
import { watermarkLine } from "@/lib/brand";
import { ProfileStudio } from "@/app/app/profiles/profile-studio";
import { displayFirstName } from "@/lib/profile/options";

export async function ProfileEditScreen({
  profile,
  me,
  photos,
  video,
  audio,
  memberCode,
  error,
  section,
}: {
  profile: Record<string, unknown> & { id: string; subject_full_name: string; profile_type: string };
  me: { id: string; email?: string | null };
  photos: { id: string; kind: string; storage_path: string }[];
  video: { id: string; kind: string; storage_path: string } | null;
  audio: { id: string; kind: string; storage_path: string } | null;
  memberCode?: string;
  error?: string;
  section?: ProfileEditTarget;
}) {
  const aboutText = aboutPlainText(String(profile.about ?? ""));
  const backTab = portraitTabForSection(section);
  const cancelHref = `/app/profiles/${profile.id}${backTab ? `?tab=${backTab}` : ""}`;
  const watermark = watermarkLine(displayFirstName(profile.subject_full_name));
  const [{ religions, communities }, lists] = await Promise.all([loadFaithCatalog(), loadFormLists()]);

  return (
    <PageShell>
      <div className="page-head-panel atelier">
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--accent)]">
          Amend profile
          {memberCode ? ` · ${memberCode}` : ""}
        </p>
        <h1 className="mt-2 font-[family-name:var(--font-british)] text-4xl">{profile.subject_full_name}</h1>
      </div>
      <p className="mt-4 max-w-2xl text-sm text-[var(--muted)]">
        Switch tabs to edit each part. Partner lists open beside the field you choose.
      </p>
      <div id="album" className="mt-8">
        <ProfileStudio
          initial={section}
          album={
            <section className="form-3d-panel">
              <p className="form-3d-kicker">Album</p>
              <h2 className="form-3d-title">
                Photographs
                <span className="field-star" aria-hidden>
                  *
                </span>
              </h2>
              <div className="gold-ornament" />
              <div className="album-trio">
                <AlbumViewer
                  photos={photos}
                  profileId={profile.id}
                  userId={me.id}
                  editable
                  framed
                  watermark={watermark}
                />
              </div>
              <div className="form-3d-actions mt-6">
                <Link href={cancelHref} className={`${btnHeroGhost} form-3d-cancel`}>
                  Cancel
                </Link>
                <Link href={`/app/profiles/${profile.id}?saved=1`} className={btnHero}>
                  Done
                </Link>
              </div>
            </section>
          }
          about={
            <IntroductionEditor
              profileId={profile.id}
              userId={me.id}
              memberCode={memberCode}
              creatorRelationship={typeof profile.creator_relationship === "string" ? profile.creator_relationship : undefined}
              about={aboutText}
              introShown={typeof profile.intro_shown === "string" ? profile.intro_shown : null}
              video={video}
              audio={audio}
              self={profile.creator_relationship === "self"}
              cancelHref={cancelHref}
              watermark={watermark}
            />
          }
        >
          <ProfileForm
            error={error}
            mode="edit"
            cancelHref={cancelHref}
            omitAbout
            allowMobileOtp={profile.created_by === me.id}
            values={{ ...profile, member_code: memberCode }}
            loginEmail={me.email ?? undefined}
            religions={religions}
            communities={communities}
            lists={lists}
            hasVideo={Boolean(video)}
            hasAudio={Boolean(audio)}
          />
        </ProfileStudio>
      </div>
    </PageShell>
  );
}
