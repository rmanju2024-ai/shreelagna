import Link from "next/link";
import { InnerShell as PageShell } from "@/components/chrome-layout";
import { ProfileForm } from "@/app/app/profiles/profile-form";
import { AlbumViewer } from "@/app/app/profiles/album-viewer";
import { IntroductionEditor } from "@/app/app/profiles/introduction-editor";
import { emptyFormLists } from "@/lib/profile/form-lists";
import { loadFaithCatalog, loadFormLists } from "@/lib/profile/load-form-lists";
import { aboutPlainText } from "@/lib/profile/about-html";
import { portraitTabForSection, SECTION_TITLES, type ProfileEditTarget } from "@/lib/profile/sections";
import { btnHero, btnHeroGhost } from "@/lib/ui/classes";
import { watermarkLine } from "@/lib/brand";
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
  const showAlbum = !section || section === "album";
  const showIntro = !section || section === "about";
  const formSection = section && section !== "album" && section !== "about" ? section : undefined;
  const showForm = !section || Boolean(formSection);
  const [{ religions, communities }, lists] = showForm
    ? await Promise.all([loadFaithCatalog(), loadFormLists()])
    : [{ religions: [], communities: [] }, emptyFormLists()];
  const heading = section ? SECTION_TITLES[section] : "Profile";
  const aboutText = aboutPlainText(String(profile.about ?? ""));
  const backTab = portraitTabForSection(section);
  const cancelHref = `/app/profiles/${profile.id}${backTab ? `?tab=${backTab}` : ""}`;
  const watermark = watermarkLine(displayFirstName(profile.subject_full_name));

  return (
    <PageShell>
      <div className="page-head-panel atelier">
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--accent)]">
          Amend {heading.toLowerCase()}
          {memberCode ? ` · ${memberCode}` : ""}
        </p>
        <h1 className="mt-2 font-[family-name:var(--font-british)] text-4xl">{profile.subject_full_name}</h1>
      </div>
      {error && !showForm ? (
        <p className="mt-4 max-w-2xl rounded-xl border border-red-200 bg-white px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      ) : showAlbum ? (
        <p className="mt-4 max-w-2xl text-sm text-[var(--muted)]">
          A photograph is required to complete the profile. Extra photographs are optional.
        </p>
      ) : showIntro ? (
        <p className="mt-4 max-w-2xl text-sm text-[var(--muted)]">
          Fill words, video, or voice however you like. The last one you select is shown on
          Introduction.
        </p>
      ) : (
        <p className="mt-4 max-w-2xl text-sm text-[var(--muted)]">
          Save this section. Other sections stay unchanged.
        </p>
      )}
      <div id="album" className="mt-8 space-y-10">
        {showAlbum ? (
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
            {!showForm ? (
              <div className="form-3d-actions mt-6">
                <Link href={cancelHref} className={`${btnHeroGhost} form-3d-cancel`}>
                  Cancel
                </Link>
                <Link href={`/app/profiles/${profile.id}?saved=1`} className={btnHero}>
                  Save
                </Link>
              </div>
            ) : null}
          </section>
        ) : null}
        {showIntro ? (
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
        ) : null}
        {showForm ? (
          <>
            <ProfileForm
              error={error}
              mode="edit"
              section={formSection}
              cancelHref={cancelHref}
              omitAbout={showIntro}
              allowMobileOtp={profile.created_by === me.id}
              values={{ ...profile, member_code: memberCode }}
              loginEmail={me.email ?? undefined}
              religions={religions}
              communities={communities}
              lists={lists}
              hasVideo={Boolean(video)}
              hasAudio={Boolean(audio)}
            />
          </>
        ) : null}
      </div>
    </PageShell>
  );
}
