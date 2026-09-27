"use client";

import { saveProfileSettings } from "@/app/app/match/actions";
import type { ProfileSettings } from "@/lib/match/profile-settings";
import { btnHero } from "@/lib/ui/classes";

function Toggle({
  name,
  title,
  hint,
  checked,
}: {
  name: string;
  title: string;
  hint: string;
  checked: boolean;
}) {
  return (
    <label className="set-row">
      <span>
        <b>{title}</b>
        <small>{hint}</small>
      </span>
      <input type="checkbox" name={name} defaultChecked={checked} />
    </label>
  );
}

export function SettingsForm({
  profileId,
  values,
}: {
  profileId: string;
  values: ProfileSettings;
}) {
  return (
    <form action={saveProfileSettings} className="set-panel">
      <input type="hidden" name="profile_id" value={profileId} />
      <p className="set-kicker">Premium settings</p>
      <h2>Privacy, discovery and alerts</h2>
      <p className="set-lead">Control who sees you, and what reaches you. Changes apply at once.</p>

      <section>
        <h3>Privacy</h3>
        <Toggle
          name="hide_last_seen"
          title="Hide last seen"
          hint="Other families will not see when you were last on Shreelagna."
          checked={values.hideLastSeen}
        />
        <Toggle
          name="hide_photo_until_accept"
          title="Lock photographs"
          hint="Show your photos only after you accept their interest."
          checked={values.hidePhotoUntilAccept}
        />
        <Toggle
          name="incognito_browse"
          title="Incognito browsing"
          hint="Visit profiles without appearing in Who viewed you or Alerts."
          checked={values.incognitoBrowse}
        />
      </section>

      <section>
        <h3>Discovery</h3>
        <Toggle
          name="pause_profile"
          title="Pause my profile"
          hint="Hide from Search until you turn this off. Inbox and chat stay with people you already know."
          checked={values.paused}
        />
      </section>

      <section>
        <h3>Alerts</h3>
        <Toggle
          name="notify_profile_views"
          title="Someone viewed my profile"
          hint="Get an alert when another member opens your profile."
          checked={values.notifyProfileViews}
        />
        <Toggle
          name="notify_interest"
          title="Interest updates"
          hint="Alert me when interest is received, accepted, or declined."
          checked={values.notifyInterest}
        />
        <Toggle
          name="notify_whatsapp"
          title="WhatsApp alerts"
          hint="Interest and plan notes on WhatsApp. No SMS. Confirm mobile on your profile first."
          checked={values.notifyWhatsapp}
        />
        <Toggle
          name="notify_match_email"
          title="Email new match suggestions"
          hint="Send a note when a complete profile fits your partner preference."
          checked={values.notifyMatchEmail}
        />
      </section>

      {values.paused ? (
        <p className="set-note">Your profile is paused and hidden from Search.</p>
      ) : null}

      <button type="submit" className={`${btnHero} set-save`}>
        Save settings
      </button>
    </form>
  );
}
