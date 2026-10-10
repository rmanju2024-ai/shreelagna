"use client";

import { saveProfileSettings } from "@/app/app/match/actions";
import { ProfileDeleteControl } from "@/app/app/profiles/profile-delete-control";
import { PushAlertsControl } from "@/components/push-alerts";
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
  canDelete = true,
}: {
  profileId: string;
  values: ProfileSettings;
  canDelete?: boolean;
}) {
  return (
    <div className="set-panel">
      <form action={saveProfileSettings}>
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
          name="hide_details_until_accept"
          title="Lock profile details"
          hint="Show only the introduction and basic identity until you accept their interest."
          checked={values.hideDetailsUntilAccept}
        />
        <label className="set-row">
          <span>
            <b>Contact release</b>
            <small>Choose whether your mobile and email can be revealed after an accepted interest.</small>
          </span>
          <select name="contact_release_mode" defaultValue={values.contactReleaseMode}>
            <option value="accepted_interest">After accepted interest</option>
            <option value="never">Keep private</option>
          </select>
        </label>
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
        <PushAlertsControl />
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
          title="Arattai alerts"
          hint="Interest, views and plan notes on Arattai. WhatsApp is not used. Confirm mobile on your profile first."
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

      {canDelete ? (
        <section className="settings-danger-zone">
          <h3>Delete profile</h3>
          <p>Use this only if you want to permanently remove this matrimonial profile.</p>
          <ProfileDeleteControl profileId={profileId} />
        </section>
      ) : null}
    </div>
  );
}
