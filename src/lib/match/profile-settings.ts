export type ContactReleaseMode = "sent_interest" | "accepted_interest" | "never";

export type ProfileSettings = {
  hideLastSeen: boolean;
  hidePhotoUntilAccept: boolean;
  hideDetailsUntilAccept: boolean;
  contactReleaseMode: ContactReleaseMode;
  notifyProfileViews: boolean;
  notifyInterest: boolean;
  notifyMatchEmail: boolean;
  notifyWhatsapp: boolean;
  paused: boolean;
};

export function parseContactReleaseMode(value: unknown): ContactReleaseMode {
  if (value === "accepted_interest" || value === "never" || value === "sent_interest") return value;
  return "sent_interest";
}

/** Whether this viewer may see the other family's mobile and email. */
export function contactMayRelease(
  mode: unknown,
  input: { sentByMe?: boolean; accepted?: boolean },
): boolean {
  const parsed = parseContactReleaseMode(mode);
  if (parsed === "never") return false;
  if (parsed === "accepted_interest") return Boolean(input.accepted);
  return Boolean(input.sentByMe || input.accepted);
}

export function flagOn(value: unknown, fallback = true): boolean {
  if (value === false || value === 0 || value === "false" || value === "0") return false;
  if (value === true || value === 1 || value === "true" || value === "on") return true;
  return fallback;
}

export function readProfileSettings(
  profile: Record<string, unknown> | null | undefined,
  account?: Record<string, unknown> | null,
): ProfileSettings {
  const status = typeof profile?.status === "string" ? profile.status : "active";
  return {
    hideLastSeen: flagOn(profile?.hide_last_seen, false),
    hidePhotoUntilAccept: flagOn(profile?.hide_photo_until_accept, true),
    hideDetailsUntilAccept: flagOn(profile?.hide_details_until_accept, false),
    contactReleaseMode: parseContactReleaseMode(profile?.contact_release_mode),
    notifyProfileViews: flagOn(profile?.notify_profile_views, true),
    notifyInterest: flagOn(profile?.notify_interest, true),
    notifyMatchEmail: flagOn(account?.notify_match_email, true),
    notifyWhatsapp: flagOn(account?.notify_whatsapp, true),
    paused: status === "hidden",
  };
}

export function canAlertInterest(profile: { notify_interest?: unknown } | null | undefined): boolean {
  return flagOn(profile?.notify_interest, true);
}

export function canAlertProfileView(profile: { notify_profile_views?: unknown } | null | undefined): boolean {
  return flagOn(profile?.notify_profile_views, true);
}
