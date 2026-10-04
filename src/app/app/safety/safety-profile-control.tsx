"use client";

import { useState } from "react";
import { blockProfile } from "@/app/app/safety/actions";

export function SafetyProfileControl({ profileId, returnTo, name = "this member" }: { profileId: string; returnTo: string; name?: string }) {
  const [confirming, setConfirming] = useState(false);
  return (
    <div className="safety-profile-control">
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
          <button type="button" className="safety-btn" onClick={() => setConfirming(true)}>🚫 Block</button>
          <a className="safety-btn" href={`/browse/${profileId}/report`}>⚑ Report</a>
        </>
      )}
    </div>
  );
}
