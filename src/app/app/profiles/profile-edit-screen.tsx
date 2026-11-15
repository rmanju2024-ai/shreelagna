import Link from "next/link";
import { InnerShell as PageShell } from "@/components/chrome-layout";
import { BackToMyProfile } from "@/components/back-to-account";
import { ProfileForm } from "@/app/app/profiles/profile-form";
import { AlbumViewer } from "@/app/app/profiles/album-viewer";
import { IntroductionEditor } from "@/app/app/profiles/introduction-editor";
import { loadFaithCatalog, loadFormLists } from "@/lib/profile/load-form-lists";
import { aboutPlainText } from "@/lib/profile/about-html";
import { isProfileEditSection, portraitTabForSection, type ProfileEditTarget } from "@/lib/profile/sections";
import { btnHero, btnHeroGhost } from "@/lib/ui/classes";
import { watermarkLine } from "@/lib/brand";
import { displayFirstName } from "@/lib/profile/options";
import { FieldMark } from "@/app/app/profiles/field-mark";

const EDIT_TABS = [
  { id: "album", label: "Album", short: "Album", mark: "Photograph" },
  { id: "personal", label: "Personal", short: "Personal", mark: "Name" },
  { id: "about", label: "Introduction", short: "Intro", mark: "Introduction" },
  { id: "work", label: "Education & work", short: "Education", mark: "Occupation" },
  { id: "family", label: "Family", short: "Family", mark: "Family" },
  { id: "faith", label: "Religion", short: "Religion", mark: "Religion" },
  { id: "partner", label: "Partner preference", short: "Preference", mark: "Partner" },
] as const;

export async function ProfileEditScreen({
  profile,
  me,
  photos,
  video,
  audio,
  memberCode,
  error,
  section,
  saved,
  embedded = false,
  staffEdit = false,
  cancelHref: cancelOverride,
  sectionHref,
  nextHref,
}: {
  profile: Record<string, unknown> & { id: string; subject_full_name: string; profile_type: string };
  me: { id: string; email?: string | null };
  photos: { id: string; kind: string; storage_path: string }[];
  video: { id: string; kind: string; storage_path: string } | null;
  audio: { id: string; kind: string; storage_path: string } | null;
  memberCode?: string;
  error?: string;
  section?: ProfileEditTarget;
  saved?: boolean;
  embedded?: boolean;
  staffEdit?: boolean;
  cancelHref?: string;
  sectionHref?: (section: string) => string;
  nextHref?: string;
}) {
  const aboutText = aboutPlainText(String(profile.about ?? ""));
  const backTab = portraitTabForSection(section);
  const cancelHref = cancelOverride ?? `/app/profiles/${profile.id}${backTab ? `?tab=${backTab}` : ""}`;
  const tabHref = (tab: string) =>
    sectionHref ? sectionHref(tab) : `/app/profiles/${profile.id}?edit=1&section=${tab}`;
  const watermark = watermarkLine(displayFirstName(profile.subject_full_name));
  const [{ religions, communities }, lists] = await Promise.all([loadFaithCatalog(), loadFormLists()]);
  const current = section && EDIT_TABS.some((tab) => tab.id === section) ? section : "album";
  const formSection = isProfileEditSection(current) && current !== "about" ? current : undefined;

  const body = (
    <>
      {embedded ? null : <BackToMyProfile href={cancelHref} />}
      <div className={`page-head-panel atelier${staffEdit ? " is-staff-edit" : ""}`}>
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--accent)]">
          {staffEdit ? "Staff edit · this member’s biodata" : "Amend profile"}
          {memberCode ? ` · ${memberCode}` : ""}
        </p>
        <h1 className="mt-2 font-[family-name:var(--font-british)] text-4xl">{profile.subject_full_name}</h1>
        {staffEdit ? (
          <p className="mt-3 text-sm font-medium text-[#6f1d1b]">You are editing their house file. This is not your personal profile.</p>
        ) : null}
        {saved ? (
          <p className="mt-3 text-sm font-medium text-emerald-800">
            {staffEdit
              ? "Saved on their biodata. Close this window to return to the member file."
              : "Saved. Stay here to keep editing, or go back to my profile when you are done."}
          </p>
        ) : null}
      </div>
      <div id="album" className="profile-studio mt-8">
        <nav className="profile-wizard-steps profile-studio-tabs" aria-label="Edit profile sections">
          {EDIT_TABS.map((tab) => (
            <Link
              key={tab.id}
              href={tabHref(tab.id)}
              className={`studio-jewel${current === tab.id ? " is-current" : ""}`}
              data-tab={tab.id}
              aria-current={current === tab.id ? "page" : undefined}
            >
              <b>
                <FieldMark label={tab.mark} />
              </b>
              <span>
                <strong>{tab.short}</strong>
                {tab.label !== tab.short ? <small>{tab.label}</small> : null}
              </span>
            </Link>
          ))}
        </nav>

        {current === "album" ? (
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
              <Link href={sectionHref ? `${tabHref("album")}&saved=1` : `/app/profiles/${profile.id}?edit=1&section=album&saved=1`} className={btnHero}>
                Save
              </Link>
            </div>
          </section>
        ) : null}

        {current === "about" ? (
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

        {formSection ? (
          <ProfileForm
            error={error}
            mode="edit"
            section={formSection}
            cancelHref={cancelHref}
            nextHref={nextHref}
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
        ) : null}
      </div>
    </>
  );

  if (embedded) return <div className="desk-staff-edit">{body}</div>;
  return <PageShell>{body}</PageShell>;
}
