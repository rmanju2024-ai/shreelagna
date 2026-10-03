"use client";

import { useState } from "react";
import { blockProfile, reportProfile } from "@/app/app/safety/actions";
import { btnGhost } from "@/lib/ui/classes";

export function SafetyProfileControl({ profileId, returnTo }: { profileId: string; returnTo: string }) {
  const [reporting, setReporting] = useState(false);
  return (
    <div className="safety-profile-control">
      <form action={blockProfile}>
        <input type="hidden" name="profile_id" value={profileId} />
        <input type="hidden" name="return_to" value={returnTo} />
        <button className={btnGhost} type="submit">Block</button>
      </form>
      <button className={btnGhost} type="button" onClick={() => setReporting((open) => !open)}>
        Report
      </button>
      {reporting ? (
        <form action={reportProfile} className="safety-report-form">
          <input type="hidden" name="profile_id" value={profileId} />
          <input type="hidden" name="return_to" value={returnTo} />
          <label>
            What happened?
            <select name="category" defaultValue="fake_profile">
              <option value="fake_profile">Fake or impersonated profile</option>
              <option value="harassment">Harassment or threats</option>
              <option value="money_request">Asked for money or financial details</option>
              <option value="inappropriate_content">Inappropriate content</option>
              <option value="marital_status">Possible marital-status concern</option>
              <option value="other">Other safety concern</option>
            </select>
          </label>
          <label>
            Details (optional)
            <textarea name="details" maxLength={2000} placeholder="Share only useful context. Do not add passwords, OTPs, or bank details." />
          </label>
          <button className={btnGhost} type="submit">Send confidential report</button>
        </form>
      ) : null}
    </div>
  );
}
