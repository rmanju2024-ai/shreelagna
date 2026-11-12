export const MEDIA_REJECT_REASONS = [
  { id: "blur", label: "Blurry" },
  { id: "wrong_person", label: "Wrong person" },
  { id: "inappropriate", label: "Inappropriate" },
  { id: "duplicate", label: "Duplicate" },
  { id: "hold_intro", label: "Hold intro (video/voice)" },
  { id: "other", label: "Other" },
] as const;

export type MediaRejectReason = (typeof MEDIA_REJECT_REASONS)[number]["id"];

export function parseMediaRejectReason(raw: unknown): MediaRejectReason | null {
  const value = String(raw ?? "").trim();
  return MEDIA_REJECT_REASONS.some((item) => item.id === value) ? (value as MediaRejectReason) : null;
}

export function mediaRejectLabel(id: string | null | undefined): string {
  return MEDIA_REJECT_REASONS.find((item) => item.id === id)?.label ?? "Needs a look";
}

export const MEMBER_UPLOAD_STATUS = "pending" as const;
