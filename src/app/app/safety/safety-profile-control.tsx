"use client";

import { useEffect, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { blockProfile } from "@/app/app/safety/actions";

const BLOCKED_COPY = "Profile blocked. You will not see each other any more.";
const FLASH_MS = 3500;

export function SafetyProfileControl({
  profileId,
  returnTo,
  name = "this member",
  icons = false,
}: {
  profileId: string;
  returnTo: string;
  name?: string;
  icons?: boolean;
}) {
  const [confirming, setConfirming] = useState(false);
  const [saving, setSaving] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);
  const [warn, setWarn] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!flash) return;
    const wait = window.setTimeout(() => {
      window.location.reload();
    }, FLASH_MS);
    return () => window.clearTimeout(wait);
  }, [flash]);

  async function onBlock(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setWarn(null);
    const result = await blockProfile(new FormData(event.currentTarget));
    if (!result.ok) {
      setSaving(false);
      setWarn(result.error);
      return;
    }
    setConfirming(false);
    setSaving(false);
    setFlash(BLOCKED_COPY);
  }

  return (
    <div className={`safety-profile-control${icons ? " is-icons" : ""}`}>
      {confirming ? (
        <form onSubmit={onBlock} className="safety-confirm">
          <input type="hidden" name="profile_id" value={profileId} />
          <input type="hidden" name="return_to" value={returnTo} />
          <p>Block {name}? You will no longer see each other.</p>
          <button type="submit" className="safety-yes" disabled={saving}>
            {saving ? "Blocking…" : "Yes, block"}
          </button>
          <button type="button" className="safety-no" onClick={() => setConfirming(false)} disabled={saving}>
            Keep
          </button>
          {warn ? (
            <p className="safety-flash is-warn" role="status">
              {warn}
            </p>
          ) : null}
        </form>
      ) : (
        <>
          <button
            type="button"
            className={`safety-btn${icons ? " is-icon" : ""}`}
            onClick={() => setConfirming(true)}
            aria-label="Block"
            title="Block"
            data-tip="Block"
            disabled={Boolean(flash)}
          >
            {icons ? "⊘" : "🚫 Block"}
          </button>
          <a
            className={`safety-btn${icons ? " is-icon" : ""}`}
            href={`/browse/${profileId}/report`}
            aria-label="Report"
            title="Report"
            data-tip="Report"
          >
            {icons ? "⚑" : "⚑ Report"}
          </a>
        </>
      )}
      {mounted && flash
        ? createPortal(
            <p className="shortlist-toast safety-block-toast" role="status">
              {flash}
            </p>,
            document.body,
          )
        : null}
    </div>
  );
}
