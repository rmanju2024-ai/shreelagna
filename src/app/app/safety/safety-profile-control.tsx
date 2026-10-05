"use client";

import { useState } from "react";
import { blockProfile } from "@/app/app/safety/actions";

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
  return (
    <div className={`safety-profile-control${icons ? " is-icons" : ""}`}>
      {confirming ? (
        <form action={blockProfile} className="safety-confirm">
          <input type="hidden" name="profile_id" value={profileId} />
          <input type="hidden" name="return_to" value={returnTo} />
          <p>Block {name}? You will no longer see each other.</p>
          <button type="submit" className="safety-yes">Yes, block</button>
          <button type="button" className="safety-no" onClick={() => setConfirming(false)}>Keep</button>
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
    </div>
  );
}
