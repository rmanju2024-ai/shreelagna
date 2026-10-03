export type TrustTier = "submitted" | "mobile_confirmed" | "details_reviewed" | "identity_checked";

const LABELS: Record<TrustTier, string> = {
  submitted: "Profile submitted",
  mobile_confirmed: "Mobile confirmed",
  details_reviewed: "Details reviewed",
  identity_checked: "Identity checked",
};

const EXPLAINERS: Record<TrustTier, string> = {
  submitted: "No verification claim has been made.",
  mobile_confirmed: "The profile mobile number was confirmed with a one-time code.",
  details_reviewed: "A Shree Lagna team member reviewed the submitted profile details.",
  identity_checked: "A Shree Lagna team member recorded an identity check. This is not a background-check guarantee.",
};

export function trustTier(value: unknown): TrustTier {
  return value === "mobile_confirmed" || value === "details_reviewed" || value === "identity_checked"
    ? value
    : "submitted";
}

export function trustTierLabel(value: unknown) {
  return LABELS[trustTier(value)];
}

export function trustTierExplainer(value: unknown) {
  return EXPLAINERS[trustTier(value)];
}
