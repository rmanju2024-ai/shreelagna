"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { clearContactFlags, translateProfileCopy } from "@/app/desk/profiles/actions";
import { contentFlagLabel, type ContentFlag } from "@/lib/moderation/content-flags";
import { isMemberAbout } from "@/lib/moderation/indian-lang";
import { btnGhost } from "@/lib/ui/classes";

export function StaffReviewTools({
  profileId,
  about,
  family,
  flags,
}: {
  profileId: string;
  about: string;
  family: string;
  flags: ContentFlag[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [introEn, setIntroEn] = useState<string | null>(null);
  const [introKn, setIntroKn] = useState<string | null>(null);
  const [familyEn, setFamilyEn] = useState<string | null>(null);
  const [familyKn, setFamilyKn] = useState<string | null>(null);
  const hasIntro = isMemberAbout(about);
  const hasFamily = isMemberAbout(family);
  if (!hasIntro && !hasFamily && !flags.length) return null;

  async function onClear() {
    setBusy("clear");
    setError(null);
    const res = await clearContactFlags(profileId);
    setBusy(null);
    if (!res.ok) setError(res.error);
    else router.refresh();
  }

  async function onCopy(field: "about" | "family", target: "en" | "kn") {
    setBusy(`${field}-${target}`);
    setError(null);
    const res = await translateProfileCopy(profileId, field, target);
    setBusy(null);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    if (field === "family") {
      if (target === "kn") setFamilyKn(res.text);
      else setFamilyEn(res.text);
      return;
    }
    if (target === "kn") setIntroKn(res.text);
    else setIntroEn(res.text);
  }

  return (
    <div className="staff-review-tools">
      <p className="staff-review-kicker">House only</p>
      {flags.length ? (
        <p className="desk-ticket-flags">{flags.map((flag) => contentFlagLabel(flag)).join(" · ")}</p>
      ) : null}
      <div className="staff-review-ops">
        {flags.length ? (
          <button type="button" className={btnGhost} disabled={Boolean(busy)} onClick={() => void onClear()}>
            {busy === "clear" ? "Clearing…" : "Clear flag"}
          </button>
        ) : null}
        {hasIntro ? (
          <>
            <button type="button" className={btnGhost} disabled={Boolean(busy)} onClick={() => void onCopy("about", "en")}>
              {busy === "about-en" ? "Translating…" : "Intro · English"}
            </button>
            <button type="button" className={btnGhost} disabled={Boolean(busy)} onClick={() => void onCopy("about", "kn")}>
              {busy === "about-kn" ? "Translating…" : "Intro · Kannada"}
            </button>
          </>
        ) : null}
        {hasFamily ? (
          <>
            <button type="button" className={btnGhost} disabled={Boolean(busy)} onClick={() => void onCopy("family", "en")}>
              {busy === "family-en" ? "Translating…" : "Family · English"}
            </button>
            <button type="button" className={btnGhost} disabled={Boolean(busy)} onClick={() => void onCopy("family", "kn")}>
              {busy === "family-kn" ? "Translating…" : "Family · Kannada"}
            </button>
          </>
        ) : null}
      </div>
      {introEn ? (
        <p className="staff-review-english">
          <strong>Intro · English.</strong> {introEn}
        </p>
      ) : null}
      {introKn ? (
        <p className="staff-review-english">
          <strong>Intro · Kannada.</strong> {introKn}
        </p>
      ) : null}
      {familyEn ? (
        <p className="staff-review-english">
          <strong>Family · English.</strong> {familyEn}
        </p>
      ) : null}
      {familyKn ? (
        <p className="staff-review-english">
          <strong>Family · Kannada.</strong> {familyKn}
        </p>
      ) : null}
      {error ? <p className="staff-review-error">{error}</p> : null}
    </div>
  );
}
