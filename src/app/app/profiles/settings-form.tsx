"use client";

import { saveProfileSettings } from "@/app/app/match/actions";
import { ProfileDeleteControl } from "@/app/app/profiles/profile-delete-control";
import { PushAlertsControl } from "@/components/push-alerts";
import { Select3d } from "@/components/select3d";
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
      <input
        type="checkbox"
        className="set-switch"
        name={name}
        role="switch"
        defaultChecked={checked}
        aria-label={title}
      />
    </label>
  );
}

export function SettingsForm({
  profileId,
  profileLabel,
  canPause = true,
  values,
  canDelete = true,
}: {
  profileId: string;
  profileLabel?: string;
  canPause?: boolean;
  values: ProfileSettings;
  canDelete?: boolean;
}) {
  return (
    <div className="set-panel">
      <form action={saveProfileSettings} key={profileId}>
      <input type="hidden" name="profile_id" value={profileId} />
      <p className="set-kicker">Premium settings</p>
      <h2>Privacy, discovery and alerts</h2>
      <p className="set-lead">
        {profileLabel
          ? `These choices apply only to ${profileLabel}. Switch the profile in use on Home to set another.`
          : "Control who sees you, and what reaches you. Changes apply at once."}
      </p>

      <section>
        <h3>Privacy</h3>
        <Toggle
          name="hide_last_seen"
          title="Hide last seen"
          hint="Other families will not see when you were last on MarriageConnect."
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
        <div className="set-row set-row-select">
          <span>
            <b>Contact release</b>
            <small>When another family may see your mobile and email. Open the list — three options.</small>
          </span>
          <Select3d
            name="contact_release_mode"
            defaultValue={values.contactReleaseMode}
            aria-label="Contact release options"
          >
            <option value="sent_interest">After they send interest (default)</option>
            <option value="accepted_interest">Only after you accept their interest</option>
            <option value="never">Never release mobile or email</option>
          </Select3d>
        </div>
      </section>

      <section>
        <h3>Discovery</h3>
        {canPause ? (
          <Toggle
            name="pause_profile"
            title="Pause my profile"
            hint="Hide this profile from Search. Inbox and chat stay with families you already know. You can still Search."
            checked={values.paused}
          />
        ) : (
          <p className="set-note">Pause is available after this profile is live.</p>
        )}
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
