import {
  ageFromDob,
  completenessFromRecord,
  completenessScore,
  formatBirthDate,
  formatBirthTime,
  smsOtpRequiredFromEnv,
} from "@/lib/profile/completeness";
import { asStringList, hopeDisplay, hopeValues, joinDisplay, languagesKnown } from "@/lib/profile/multi-values";
import { displayFirstName, HOPE_ANY, maritalLabel, postedAsLabel, profileKindLabel, siblingLine } from "@/lib/profile/options";
import { parentWorkLabel } from "@/lib/profile/parent-line";
import { VAGUE_EDUCATIONS } from "@/lib/profile/catalog";
import { AlbumViewer } from "@/app/app/profiles/album-viewer";
import { IntroStudio } from "@/app/app/profiles/media-studio";
import { PortraitSheet } from "@/app/app/profiles/portrait-board";
import { aboutPlainText } from "@/lib/profile/about-html";
import { watermarkLine } from "@/lib/brand";
import { StaffReviewTools } from "@/app/desk/profiles/review-tools";
import {
  activeContactFlags,
  MEMBER_CONTACT_WARNING,
} from "@/lib/moderation/content-flags";
import { resolveIntroShown } from "@/lib/profile/caps";
import { preferenceSheetRows, seekPronoun, type MatchSelf } from "@/lib/profile/match-compare";
import { MobileOtpField, VerifyFlag } from "@/app/app/profiles/mobile-otp-field";
import { CompletenessMeter } from "@/app/app/profiles/completeness-meter";
import { trustTier, trustTierExplainer, trustTierLabel } from "@/lib/profile/trust-tier";

type Media = { id: string; kind: string; storage_path: string; status?: string };

export function ProfilePortrait({
  profile,
  memberCode,
  religionName,
  communityName,
  photos,
  photoLocked = false,
  video,
  audio,
  initialTab,
  loginEmail,
  readOnly = false,
  viewer = null,
  interest,
  contact = null,
  needPlan = false,
  lockAlbumExtras = false,
  deskReview = false,
  houseEdit = false,
  detailsLocked = false,
}: {
  profile: Record<string, unknown> & {
    id: string;
    creator_relationship: string;
    profile_type: string;
    subject_full_name: string;
    date_of_birth: string;
    mother_tongue: string | null;
    height_cm: number | null;
    marital_status: string | null;
    diet: string | null;
    native_state: string | null;
    current_city: string | null;
    qualification: string | null;
    occupation: string | null;
    about: string | null;
    is_complete: boolean;
    status?: string | null;
    contact_flags_cleared_hash?: string | null;
  };
  memberCode?: string;
  religionName?: string;
  communityName?: string;
  photos: Media[];
  photoLocked?: boolean;
  video?: Media | null;
  audio?: Media | null;
  initialTab?: string;
  loginEmail?: string | null;
  readOnly?: boolean;
  viewer?: MatchSelf | null;
  interest?: React.ReactNode;
  contact?: { revealed: boolean; mobile: string; email: string } | null;
  needPlan?: boolean;
  lockAlbumExtras?: boolean;
  deskReview?: boolean;
  houseEdit?: boolean;
  detailsLocked?: boolean;
}) {
  const kind = profileKindLabel(profile.profile_type);
  const posted = postedAsLabel(profile.creator_relationship, profile.profile_type);
  const shownName = readOnly ? displayFirstName(profile.subject_full_name) : profile.subject_full_name;
  const profileTrust = trustTier(profile.trust_tier);
  const watermark = watermarkLine(displayFirstName(profile.subject_full_name));
  const contactAlerts = activeContactFlags(
    profile.about,
    typeof profile.contact_flags_cleared_hash === "string" ? profile.contact_flags_cleared_hash : null,
  );
  const age = ageFromDob(profile.date_of_birth);
  const education =
    profile.qualification && !new Set<string>(VAGUE_EDUCATIONS).has(profile.qualification)
      ? profile.qualification
      : "—";
  const nativePlace = [profile.native_city, profile.native_state, profile.native_country]
    .filter((v) => typeof v === "string" && v.trim())
    .join(", ");
  const place = [profile.current_city, profile.current_state, profile.current_country]
    .filter((v) => typeof v === "string" && v.trim())
    .join(", ");
  const aboutHtml = typeof profile.about === "string" ? profile.about : null;
  const shownIntro = resolveIntroShown(
    profile.intro_shown,
    Boolean(aboutPlainText(aboutHtml ?? "")),
    Boolean(video),
    Boolean(audio),
  );

  const text = (key: string) => {
    const v = profile[key];
    return typeof v === "string" && v.trim() ? v : "—";
  };
  const needsCity = !profile.current_country || profile.current_country === "India";

  const personal = [
    {
      title: kind,
      items: [
        { k: "Age", v: age ? `${age.years} years, ${age.months} months, ${age.days} days` : "—" },
        { k: "Gharane / Surname", v: text("surname"), required: true },
        { k: "Blood group", v: text("blood_group") },
        { k: "Height", v: profile.height_cm ? `${profile.height_cm} cm` : "—", required: true },
        { k: "Mother tongue", v: profile.mother_tongue ?? "—" },
        { k: "Languages known", v: joinDisplay(languagesKnown(profile)) },
        { k: "Marital status", v: maritalLabel(profile.marital_status) || "—", required: true },
        ...(readOnly
          ? contact
            ? [
                {
                  k: "Mobile",
                  required: true,
                  v: contact.revealed ? contact.mobile : "Hidden",
                  extra:
                    contact.revealed && profile.phone_otp_verified_at ? (
                      <VerifyFlag on tone="whatsapp" label="Arattai verified" />
                    ) : null,
                },
                {
                  k: "Email ID",
                  required: true,
                  v: contact.revealed ? contact.email : "Hidden",
                  extra: contact.revealed ? <VerifyFlag on label="Gmail sign-in" /> : null,
                },
              ]
            : []
          : [
              {
                k: "Mobile",
                required: true,
                v: text("subject_mobile"),
                extra: deskReview ? (
                  <VerifyFlag
                    on={Boolean(profile.phone_otp_verified_at)}
                    tone="whatsapp"
                    label="Arattai verified"
                  />
                ) : (
                  <MobileOtpField
                    embed
                    profileId={profile.id}
                    defaultMobile={typeof profile.subject_mobile === "string" ? profile.subject_mobile : ""}
                    verified={Boolean(profile.phone_otp_verified_at)}
                  />
                ),
              },
              {
                k: "Email ID",
                required: true,
                v: loginEmail?.trim() || "—",
                extra: <VerifyFlag on={Boolean(loginEmail?.trim())} label="Gmail sign-in" />,
              },
            ]),
      ],
    },
    {
      title: "Native place and residence",
      items: [
        { k: "Grew up in", v: text("grew_up_in") },
        { k: "Native place", v: nativePlace || "—" },
        { k: "Current residence", v: place || "—", required: needsCity },
        { k: "Living arrangement", v: text("living_arrangement") },
        { k: "Residency status", v: text("citizenship") },
      ],
    },
    {
      title: "Health and habits",
      items: [
        { k: "Diet", v: profile.diet ?? "—" },
        { k: "Disability", v: text("physical_status") },
        { k: "Health status", v: text("health_notes") },
        { k: "Hobbies", v: joinDisplay(asStringList(profile.hobby_list)) },
      ],
    },
  ];

  const faith = [
    {
      title: "Religion",
      items: [
        { k: "Religion", v: religionName ?? "—" },
        { k: "Community", v: communityName ?? "—" },
        { k: "Sub-community", v: text("sub_community") },
        { k: "Gothra", v: text("gotra") },
      ],
    },
    {
      title: "Astronomy",
      items: [
        { k: "Date of birth", v: formatBirthDate(profile.date_of_birth) ?? "—", required: true },
        {
          k: "Time of birth",
          required: true,
          v: formatBirthTime(typeof profile.birth_time === "string" ? profile.birth_time : "") ?? "—",
        },
        { k: "City of birth", v: text("birth_city"), required: true },
        { k: "Rashi", v: text("rashi") },
        { k: "Lagna", v: text("lagna") },
        { k: "Nakshatra", v: text("nakshatra") },
        { k: "Nakshatra pada", v: text("nakshatra_pada") === "—" ? "—" : `Pada ${text("nakshatra_pada")}` },
        { k: "Gana", v: text("gana") },
        { k: "Yoni animal", v: text("yoni_animal") },
        { k: "Mangalik", v: text("manglik") },
      ],
    },
  ];

  const work = [
    {
      title: "Education",
      items: [
        { k: "Highest education", v: education, required: true },
        { k: "College", v: text("college_name") },
      ],
    },
    {
      title: "Workplace",
      items: [
        { k: "Working as", v: profile.occupation ?? "—", required: true },
        { k: "Employed in", v: typeof profile.employed_in === "string" ? profile.employed_in : "—" },
        { k: "Employer name", v: typeof profile.employer_name === "string" && profile.employer_name.trim() ? profile.employer_name : "—" },
        { k: "Wish to settle in abroad", v: text("settle_abroad") },
        { k: "Future ambition", v: text("future_ambition") },
      ],
    },
    {
      title: "Income",
      items: [{ k: "Annual income", v: typeof profile.income_band === "string" ? profile.income_band : "—" }],
    },
  ];

  const family = [
    {
      title: "Parents",
      items: [
        {
          k: "Father",
          v: text("father_name"),
          sub: parentWorkLabel(typeof profile.father_occupation === "string" ? profile.father_occupation : null) || undefined,
        },
        {
          k: "Mother",
          v: text("mother_name"),
          sub: parentWorkLabel(typeof profile.mother_occupation === "string" ? profile.mother_occupation : null) || undefined,
        },
      ],
    },
    {
      title: "Family background",
      items: [
        { k: "Family type", v: typeof profile.family_type === "string" ? profile.family_type : "—" },
        { k: "Family financial status", v: text("family_status") },
        { k: "Where the family lives", v: text("family_location") },
        { k: "Brothers", v: siblingLine(profile.brothers_count, profile.brothers_married_count) },
        { k: "Sisters", v: siblingLine(profile.sisters_count, profile.sisters_married_count) },
      ],
    },
  ];
  const familyNote =
    typeof profile.siblings_note === "string" && aboutPlainText(profile.siblings_note)
      ? profile.siblings_note
      : null;

  const publicBase = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/profile-media/`;
  const hopeSheet = viewer
    ? {
        rows: preferenceSheetRows(profile, viewer),
        theirPhoto: photos[0]?.storage_path ? `${publicBase}${photos[0].storage_path}` : null,
        yourPhoto: viewer.photoPath ? `${publicBase}${viewer.photoPath}` : null,
        pronoun: seekPronoun(profile.profile_type),
      }
    : null;
  const hopeFact = (k: string, v: string) => ({ k, v });
  const hope = [
    {
      title: "Age, height and lifestyle",
      items: [
        hopeFact(
          "Age",
          profile.pref_age_min && profile.pref_age_max
            ? `${profile.pref_age_min}–${profile.pref_age_max} years`
            : "—",
        ),
        hopeFact(
          "Height",
          typeof profile.pref_height_min === "number" && typeof profile.pref_height_max === "number"
            ? `${profile.pref_height_min}–${profile.pref_height_max} cm`
            : "—",
        ),
        hopeFact(
          "Marital status",
          hopeDisplay(
            hopeValues(profile, "pref_maritals", "pref_marital").map((m) =>
              m === HOPE_ANY.marital ? "Any marital status" : maritalLabel(m) || m,
            ),
            "Any marital status",
          ),
        ),
        hopeFact("Diet", hopeDisplay(hopeValues(profile, "pref_diets"), HOPE_ANY.diet)),
        hopeFact(
          "Horoscopic match",
          hopeValues(profile, "pref_horoscope")[0] || "Does not matter",
        ),
      ],
    },
    {
      title: "Faith and home",
      items: [
        hopeFact("Mother tongue", hopeDisplay(hopeValues(profile, "pref_tongues"), HOPE_ANY.language)),
        hopeFact("Religion", hopeDisplay(hopeValues(profile, "pref_religions"), HOPE_ANY.religion)),
        hopeFact(
          "Community / caste",
          hopeDisplay(hopeValues(profile, "pref_communities"), HOPE_ANY.community),
        ),
        hopeFact(
          "Country living in",
          hopeDisplay(hopeValues(profile, "pref_countries", "pref_country"), HOPE_ANY.country),
        ),
        hopeFact(
          "State living in",
          hopeDisplay(hopeValues(profile, "pref_states", "pref_state"), HOPE_ANY.state),
        ),
        hopeFact("City / district", hopeDisplay(hopeValues(profile, "pref_cities"), HOPE_ANY.city)),
      ],
    },
    {
      title: "Education and work",
      items: [
        hopeFact(
          "Education",
          hopeDisplay(hopeValues(profile, "pref_educations", "pref_education"), HOPE_ANY.education),
        ),
        hopeFact(
          "Working as",
          hopeDisplay(hopeValues(profile, "pref_occupations", "pref_occupation"), HOPE_ANY.occupation),
        ),
        hopeFact("Employed in", hopeDisplay(hopeValues(profile, "pref_employed"), HOPE_ANY.employed)),
        hopeFact("Annual income", hopeDisplay(hopeValues(profile, "pref_incomes"), HOPE_ANY.income)),
      ],
    },
  ];

  const mediaApproved = (row?: Media | null) => Boolean(row && (row.status === "approved" || !row.status));
  const completeness = readOnly
    ? null
    : completenessScore(
        completenessFromRecord(profile, {
          hasApprovedPhoto: photos.some((row) => mediaApproved(row)),
          hasVideo: mediaApproved(video),
          hasAudio: mediaApproved(audio),
          emailOtpVerified: Boolean(loginEmail?.trim()),
          smsOtpRequired: smsOtpRequiredFromEnv(),
        }),
      );

  return (
    <div className="portrait-page">
      {completeness ? (
        <CompletenessMeter
          profileId={profile.id}
          mandatoryPct={completeness.mandatoryPct}
          overallPct={completeness.overallPct}
          mandatoryFilled={completeness.mandatoryFilled}
          mandatoryTotal={completeness.mandatoryTotal}
          overallFilled={completeness.overallFilled}
          overallTotal={completeness.overallTotal}
          pendingMandatory={completeness.pendingMandatory}
          pendingRecommended={completeness.pendingRecommended}
        />
      ) : null}
      {!readOnly &&
      (profile.status === "pending_review" || (profile.is_complete && (profile.status === "draft" || !profile.status))) ? (
        <p className="portrait-review-note">Awaiting house review. Search opens after Staff approve.</p>
      ) : null}
      {!readOnly && !deskReview && contactAlerts.length ? (
        <p className="portrait-flag-note">{MEMBER_CONTACT_WARNING}</p>
      ) : null}
      {deskReview ? (
        <StaffReviewTools
          profileId={profile.id}
          about={typeof profile.about === "string" ? profile.about : ""}
          family={familyNote ?? ""}
          flags={contactAlerts}
        />
      ) : null}
      <p className={`profile-trust profile-trust-${profileTrust}`} title={trustTierExplainer(profileTrust)}>
        <span aria-hidden>✦</span>
        {trustTierLabel(profileTrust)}
      </p>
      <PortraitSheet
        album={
          <AlbumViewer
            photos={photos}
            profileId={profile.id}
            locked={photoLocked}
            gateExtras={needPlan || lockAlbumExtras}
            watermark={watermark}
          />
        }
        kind={kind}
        profileType={profile.profile_type}
        lastSeenAt={typeof profile.last_seen_at === "string" ? profile.last_seen_at : null}
        name={shownName}
        memberCode={memberCode}
        posted={posted}
        editHref={`/app/profiles/${profile.id}?edit=1`}
        editable={!readOnly}
        houseEdit={houseEdit}
        initialTab={initialTab}
        interest={interest}
        about={shownIntro === "about" ? aboutHtml : null}
        introMedia={
          shownIntro === "video" && video ? (
            <IntroStudio video={video} audio={null} profileId={profile.id} offer="video" watermark={watermark} />
          ) : shownIntro === "audio" && audio ? (
            <IntroStudio video={null} audio={audio} profileId={profile.id} offer="audio" />
          ) : null
        }
        introEdit="about"
        personal={personal}
        faith={faith}
        work={work}
        family={family}
        familyNote={familyNote}
        hope={hope}
        hopeSheet={hopeSheet}
        needPlan={needPlan}
        detailsLocked={detailsLocked}
      />
    </div>
  );
}
