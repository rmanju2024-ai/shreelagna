"use client";

import { useState } from "react";
import Link from "next/link";
import { AboutEditor } from "@/app/app/profiles/about-editor";
import { IntroStudio } from "@/app/app/profiles/media-studio";
import { FieldHelp } from "@/app/app/profiles/field-help";
import { saveAboutIntro, saveIntroChoice } from "@/app/app/profiles/actions";
import { ABOUT_MAX, ABOUT_MIN, aboutPlainText } from "@/lib/profile/about-html";
import { resolveIntroShown } from "@/lib/profile/caps";
import { btnHero, btnHeroGhost } from "@/lib/ui/classes";

type Kind = "words" | "video" | "voice";
type Clip = { id: string; kind: string; storage_path: string };

function kindFromShown(shown: ReturnType<typeof resolveIntroShown>): Kind | null {
  if (shown === "video") return "video";
  if (shown === "audio") return "voice";
  if (shown === "about") return "words";
  return null;
}

function IntroTips() {
  return (
    <div className="intro-tips">
      <section className="intro-tips-col is-do">
        <h3>Do’s</h3>
        <ul>
          <li>Cover who you are: nature, upbringing, education, and work.</li>
          <li>Mention family, values, faith in daily life, hobbies, and a usual day.</li>
          <li>Include partner expectations — the qualities you hope for in a match.</li>
          <li>Be warm, specific, and honest — in your own voice.</li>
          <li>Words: {ABOUT_MIN}–{ABOUT_MAX} characters. Video or voice: under 3 minutes, clear and quiet.</li>
        </ul>
      </section>
      <section className="intro-tips-col is-dont">
        <h3>Don’ts</h3>
        <ul>
          <li>Do not share a mobile number, email, WhatsApp, or address.</li>
          <li>Do not paste a copied bio or speak unkindly of family or past matches.</li>
        </ul>
      </section>
    </div>
  );
}

export function IntroductionEditor({
  profileId,
  userId,
  memberCode: _memberCode,
  creatorRelationship: _creatorRelationship,
  about,
  introShown,
  video,
  audio,
  self,
  cancelHref,
  watermark,
}: {
  profileId: string;
  userId: string;
  memberCode?: string;
  creatorRelationship?: string;
  about: string;
  introShown?: string | null;
  video: Clip | null;
  audio: Clip | null;
  self: boolean;
  cancelHref: string;
  watermark?: string;
}) {
  const hasAbout = about.trim().length > 0;
  const [kind, setKind] = useState<Kind | null>(() =>
    kindFromShown(resolveIntroShown(introShown, hasAbout, Boolean(video), Boolean(audio))),
  );
  const [videoReady, setVideoReady] = useState(Boolean(video));
  const [audioReady, setAudioReady] = useState(Boolean(audio));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [storedMessage, setStoredMessage] = useState<string | null>(null);

  function pick(next: Kind) {
    setKind(next);
    setError(null);
    setStoredMessage(null);
  }

  function goPortrait() {
    window.location.assign(`/app/profiles/${profileId}?saved=1&tab=intro`);
  }

  async function saveWords(form: HTMLFormElement) {
    if (saving) return;
    const text = String(new FormData(form).get("about") ?? "");
    const n = aboutPlainText(text).length;
    if (n < ABOUT_MIN) {
      setError(`Write at least ${ABOUT_MIN} characters.`);
      return;
    }
    if (n > ABOUT_MAX) {
      setError(`Keep About under ${ABOUT_MAX} characters.`);
      return;
    }
    setSaving(true);
    setError(null);
    const result = await saveAboutIntro(profileId, text);
    if (!result.ok) {
      setError(result.error);
      setSaving(false);
      return;
    }
    goPortrait();
  }

  async function saveMedia(shown: "video" | "audio") {
    if (saving) return;
    setSaving(true);
    setError(null);
    const result = await saveIntroChoice(profileId, shown);
    if (!result.ok) {
      setError(result.error);
      setSaving(false);
      return;
    }
    goPortrait();
  }

  return (
    <section className="form-3d-panel">
      <p className="form-3d-kicker">Introduction</p>
      <h2 className="form-3d-title">
        How to introduce
        <span className="field-star" aria-hidden>
          *
        </span>
      </h2>
      <div className="gold-ornament" />
      <p className="mt-3 text-sm text-[var(--muted)]">
        Use any or all of these. The last one you select is shown on Introduction.
      </p>
      <div className="choice-3d-grid intro-choice-grid mt-6" role="radiogroup" aria-label="Introduction type">
        <label className="choice-3d">
          <input
            type="radio"
            name="intro_kind"
            checked={kind === "words"}
            onChange={() => pick("words")}
          />
          <strong>Words</strong>
          <em>Write About in your own words</em>
        </label>
        <label className="choice-3d">
          <input
            type="radio"
            name="intro_kind"
            checked={kind === "video"}
            onChange={() => pick("video")}
          />
          <strong>Video</strong>
          <em>A short clip, up to 3 minutes</em>
        </label>
        <label className="choice-3d">
          <input
            type="radio"
            name="intro_kind"
            checked={kind === "voice"}
            onChange={() => pick("voice")}
          />
          <strong>Voice</strong>
          <em>Record or upload a voice note</em>
        </label>
      </div>
      {error ? (
        <p className="mt-4 rounded-xl border border-red-200 bg-white px-4 py-3 text-sm text-red-800">{error}</p>
      ) : null}
      {kind ? <IntroTips /> : null}

      {kind === "words" ? (
        <form
          className="form-3d intro-choice-body"
          autoComplete="off"
          onSubmit={(e) => {
            e.preventDefault();
            void saveWords(e.currentTarget);
          }}
        >
          <div className="field-3d">
            <span className="field-3d-label">
              {self ? "About you" : "About them"}
              <span className="field-star" aria-hidden>
                *
              </span>
              <FieldHelp text={`Write ${ABOUT_MIN}–${ABOUT_MAX} characters.`} />
            </span>
            <AboutEditor
              name="about"
              required
              key={about ? "about-saved" : "about-new"}
              placeholder={`Write at least ${ABOUT_MIN} characters.`}
              defaultValue={about}
            />
          </div>
          <div className="form-3d-actions mt-6">
            <Link href={cancelHref} className={`${btnHeroGhost} form-3d-cancel`}>
              Cancel
            </Link>
            <button type="submit" className={btnHero} disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      ) : null}

      {kind === "video" ? (
        <div className="intro-choice-body intro-choice-media">
          <IntroStudio
            profileId={profileId}
            userId={userId}
            video={video}
            audio={audio}
            hasAbout={hasAbout}
            editable
            offer="video"
            watermark={watermark}
            onStored={() => {
              setVideoReady(true);
              setStoredMessage("Video saved. It is now selected for your Introduction.");
            }}
            onCleared={() => {
              setVideoReady(false);
              setStoredMessage(null);
            }}
          />
          {storedMessage ? <p className="mt-3 text-sm font-medium text-emerald-700">{storedMessage}</p> : null}
          <p className="mt-3 text-sm text-[var(--muted)]">
            Upload saves and selects the clip. Tap Save to return to your profile.
          </p>
          <div className="form-3d-actions mt-6">
            <Link href={cancelHref} className={`${btnHeroGhost} form-3d-cancel`}>
              Cancel
            </Link>
            <button
              type="button"
              className={btnHero}
              disabled={!videoReady || saving}
              onClick={() => void saveMedia("video")}
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      ) : null}

      {kind === "voice" ? (
        <div className="intro-choice-body intro-choice-media">
          <IntroStudio
            profileId={profileId}
            userId={userId}
            video={video}
            audio={audio}
            hasAbout={hasAbout}
            editable
            offer="audio"
            watermark={watermark}
            onStored={() => {
              setAudioReady(true);
              setStoredMessage("Voice note saved. It is now selected for your Introduction.");
            }}
            onCleared={() => {
              setAudioReady(false);
              setStoredMessage(null);
            }}
          />
          {storedMessage ? <p className="mt-3 text-sm font-medium text-emerald-700">{storedMessage}</p> : null}
          <p className="mt-3 text-sm text-[var(--muted)]">
            Upload saves and selects the voice note. Tap Save to return to your profile.
          </p>
          <div className="form-3d-actions mt-6">
            <Link href={cancelHref} className={`${btnHeroGhost} form-3d-cancel`}>
              Cancel
            </Link>
            <button
              type="button"
              className={btnHero}
              disabled={!audioReady || saving}
              onClick={() => void saveMedia("audio")}
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      ) : null}

      {!kind ? (
        <div className="form-3d-actions mt-6">
          <Link href={cancelHref} className={`${btnHeroGhost} form-3d-cancel`}>
            Cancel
          </Link>
        </div>
      ) : null}
    </section>
  );
}
