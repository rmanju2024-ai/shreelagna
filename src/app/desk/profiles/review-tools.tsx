"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { clearContactFlags, translateProfileBundle } from "@/app/desk/profiles/actions";
import { contentFlagLabel, type ContentFlag } from "@/lib/moderation/content-flags";
import { isMemberAbout } from "@/lib/moderation/indian-lang";
import { btnGhost } from "@/lib/ui/classes";

function line(label: string, value: string | null) {
  return (
    <p className="staff-review-english">
      <strong>{label}.</strong> {value?.trim() || "Not available"}
    </p>
  );
}

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
  const [bundle, setBundle] = useState<{
    introEn: string | null;
    introKn: string | null;
    familyEn: string | null;
    familyKn: string | null;
  } | null>(null);
  const canTranslate = isMemberAbout(about) || isMemberAbout(family);
  if (!canTranslate && !flags.length) return null;

  async function onClear() {
    setBusy("clear");
    setError(null);
    const res = await clearContactFlags(profileId);
    setBusy(null);
    if (!res.ok) setError(res.error);
    else router.refresh();
  }

  async function onTranslate() {
    setBusy("translate");
    setError(null);
    const res = await translateProfileBundle(profileId);
    setBusy(null);
    if (!res.ok) {
      setError(res.error);
      setBundle({ introEn: null, introKn: null, familyEn: null, familyKn: null });
      return;
    }
    setBundle({
      introEn: res.introEn,
      introKn: res.introKn,
      familyEn: res.familyEn,
      familyKn: res.familyKn,
    });
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
        {canTranslate ? (
          <button type="button" className={btnGhost} disabled={Boolean(busy)} onClick={() => void onTranslate()}>
            {busy === "translate" ? "Translating…" : "Translate"}
          </button>
        ) : null}
      </div>
      {bundle ? (
        <div className="staff-review-bundle">
          {line("Intro · English", bundle.introEn)}
          {line("Intro · Kannada", bundle.introKn)}
          {line("Family · English", bundle.familyEn)}
          {line("Family · Kannada", bundle.familyKn)}
        </div>
      ) : null}
      {error ? <p className="staff-review-error">{error}</p> : null}
    </div>
  );
}
