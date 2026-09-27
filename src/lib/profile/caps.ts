export const MAX_PROFILES_PER_ACCOUNT = 1;
export const MAX_PHOTOS_PER_PROFILE = 3;
export const MAX_INTRO_SECONDS = 180;

export function canAddProfile(existingCount: number): boolean {
  return existingCount < MAX_PROFILES_PER_ACCOUNT;
}

export function canAddPhoto(existingPhotoCount: number): boolean {
  return existingPhotoCount < MAX_PHOTOS_PER_PROFILE;
}

export function introDurationAllowed(seconds: number): boolean {
  return seconds > 0 && seconds <= MAX_INTRO_SECONDS;
}

export type IntroFlags = { about?: boolean; video: boolean; audio: boolean };

export type IntroShown = "about" | "video" | "audio";

/** Words, video, and voice may all be kept. */
export function canAddIntro(
  _kind: "video" | "audio",
  _existing?: IntroFlags,
): boolean {
  return true;
}

export function canWriteAbout(_existing?: { video: boolean; audio: boolean }): boolean {
  return true;
}

export function resolveIntroShown(
  shown: unknown,
  hasAbout: boolean,
  hasVideo: boolean,
  hasAudio: boolean,
): IntroShown | null {
  const want = shown === "about" || shown === "video" || shown === "audio" ? shown : null;
  if (want === "about" && hasAbout) return "about";
  if (want === "video" && hasVideo) return "video";
  if (want === "audio" && hasAudio) return "audio";
  if (hasAbout) return "about";
  if (hasVideo) return "video";
  if (hasAudio) return "audio";
  return null;
}
